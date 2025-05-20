import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Connection, Model, Types, ClientSession } from 'mongoose';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { Reward, RewardDocument, RewardType } from './schemas/reward.schema';
import { EventsService } from '../events/events.service';
import { EventStatus, EventDocument } from '../events/schemas/event.schema';
import {
  FindAllRewardsQueryDto,
  RewardSortOrder,
} from './dto/find-all-rewards-query.dto';
import { FilterQuery } from 'mongoose';

export interface PaginatedRewardsResponse {
  data: Reward[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

@Injectable()
export class RewardsService {
  constructor(
    @InjectModel(Reward.name) private rewardModel: Model<RewardDocument>,
    private readonly eventsService: EventsService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(
    createRewardDto: CreateRewardDto,
    userId: string,
  ): Promise<Reward> {
    const { eventId, type, itemCode, couponCode, ...restOfDto } =
      createRewardDto;

    try {
      const event = await this.eventsService.findOne(eventId);
      if (!event) {
        throw new NotFoundException(
          `해당 ID의 이벤트를 찾을 수 없습니다: "${eventId}"`,
        );
      }
      if ([EventStatus.ENDED, EventStatus.CANCELLED].includes(event.status)) {
        throw new BadRequestException(
          `종료되었거나 취소된 이벤트에는 보상을 추가할 수 없습니다. (상태: ${event.status})`,
        );
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          `해당 ID의 이벤트를 찾을 수 없거나 삭제되었습니다: "${eventId}"`,
        );
      }
      throw error;
    }

    if (type === RewardType.ITEM && !itemCode) {
      throw new BadRequestException(
        'ITEM 타입 보상에는 itemCode가 필수입니다.',
      );
    }
    if (type === RewardType.COUPON && !couponCode) {
      throw new BadRequestException(
        'COUPON 타입 보상에는 couponCode가 필수입니다.',
      );
    }
    if (type === RewardType.POINT && (itemCode || couponCode)) {
      throw new BadRequestException(
        'POINT 타입 보상에는 itemCode/couponCode를 입력할 수 없습니다.',
      );
    }

    const rewardToCreate = new this.rewardModel({
      ...restOfDto,
      eventId: new Types.ObjectId(eventId),
      type,
      itemCode: type === RewardType.ITEM ? itemCode : undefined,
      couponCode: type === RewardType.COUPON ? couponCode : undefined,
      createdBy: userId,
    });

    return rewardToCreate.save();
  }

  async findAll(
    queryDto: FindAllRewardsQueryDto,
  ): Promise<PaginatedRewardsResponse> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = RewardSortOrder.DESC,
      eventId,
      type,
    } = queryDto;

    const skip = (page - 1) * limit;
    const filter: FilterQuery<RewardDocument> = {
      deletedAt: null,
    };

    if (eventId) {
      filter.eventId = new Types.ObjectId(eventId);
    }
    if (type) {
      filter.type = type;
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === RewardSortOrder.ASC ? 1 : -1;

    const total = await this.rewardModel.countDocuments(filter).exec();
    const data = await this.rewardModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('eventId', 'name status')
      .exec();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async findOne(id: string): Promise<Reward> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('잘못된 보상 ID 형식입니다.');
    }
    const reward = await this.rewardModel
      .findOne({ _id: new Types.ObjectId(id), deletedAt: null })
      .populate('eventId', 'name status')
      .exec();

    if (!reward) {
      throw new NotFoundException(
        `해당 ID의 보상을 찾을 수 없거나 삭제되었습니다: "${id}"`,
      );
    }
    return reward;
  }

  async update(
    id: string,
    updateRewardDto: UpdateRewardDto,
    userId: string,
  ): Promise<Reward> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('잘못된 보상 ID 형식입니다.');
    }

    const currentReward = await this.findOne(id);

    const { eventId, type, itemCode, couponCode, ...restOfDto } =
      updateRewardDto;
    const payload: any = { ...restOfDto };

    if (eventId && eventId !== currentReward.eventId.toString()) {
      try {
        const event = await this.eventsService.findOne(eventId);
        if (!event) throw new NotFoundException();
        if ([EventStatus.ENDED, EventStatus.CANCELLED].includes(event.status)) {
          throw new BadRequestException(
            `종료되었거나 취소된 이벤트에는 보상을 연결할 수 없습니다. (상태: ${event.status})`,
          );
        }
        payload.eventId = new Types.ObjectId(eventId);
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw new NotFoundException(
            `새로운 이벤트 ID "${eventId}"를 찾을 수 없거나 삭제되었습니다.`,
          );
        }
        throw error;
      }
    }

    const newType = type || currentReward.type;
    const newItemCode =
      itemCode !== undefined ? itemCode : currentReward.itemCode;
    const newCouponCode =
      couponCode !== undefined ? couponCode : currentReward.couponCode;

    if (newType === RewardType.ITEM && !newItemCode) {
      throw new BadRequestException(
        'ITEM 타입 보상에는 itemCode가 필수입니다.',
      );
    }
    if (newType === RewardType.COUPON && !newCouponCode) {
      throw new BadRequestException(
        'COUPON 타입 보상에는 couponCode가 필수입니다.',
      );
    }
    if (newType === RewardType.POINT && (newItemCode || newCouponCode)) {
      throw new BadRequestException(
        'POINT 타입 보상에는 itemCode/couponCode를 입력할 수 없습니다.',
      );
    }
    payload.type = newType;
    payload.itemCode = newType === RewardType.ITEM ? newItemCode : undefined;
    payload.couponCode =
      newType === RewardType.COUPON ? newCouponCode : undefined;

    const linkedEvent = currentReward.eventId as unknown as EventDocument;
    if (
      linkedEvent &&
      [EventStatus.ENDED, EventStatus.CANCELLED].includes(linkedEvent.status)
    ) {
      const forbiddenFields = [
        'name',
        'type',
        'quantity',
        'description',
        'itemCode',
        'couponCode',
      ];
      for (const field of forbiddenFields) {
        if (
          updateRewardDto[field] !== undefined &&
          updateRewardDto[field] !== currentReward[field]
        ) {
          throw new BadRequestException(
            `종료되었거나 취소된 이벤트의 보상 정보는 수정할 수 없습니다. (상태: ${linkedEvent.status})`,
          );
        }
      }
    }

    payload.updatedBy = userId;

    const updatedReward = await this.rewardModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), deletedAt: null },
        payload,
        {
          new: true,
        },
      )
      .populate('eventId', 'name status')
      .exec();

    if (!updatedReward) {
      throw new NotFoundException(
        `해당 ID의 보상을 찾을 수 없거나 삭제되었거나, 업데이트 중 문제가 발생했습니다: "${id}"`,
      );
    }
    return updatedReward;
  }

  async remove(id: string, userId: string): Promise<Reward> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('잘못된 보상 ID 형식입니다.');
    }

    const currentReward = await this.rewardModel.findOne({
      _id: new Types.ObjectId(id),
      deletedAt: null,
    });

    if (!currentReward) {
      throw new NotFoundException(
        `해당 ID의 보상을 찾을 수 없거나 이미 삭제되었습니다: "${id}"`,
      );
    }

    const updatePayload = {
      deletedAt: new Date(),
      deletedBy: userId,
    };

    const softDeletedReward = await this.rewardModel
      .findByIdAndUpdate(
        new Types.ObjectId(id),
        { $set: updatePayload },
        { new: true },
      )
      .populate('eventId', 'name status')
      .exec();

    if (!softDeletedReward) {
      throw new NotFoundException(
        `해당 ID의 보상을 삭제할 수 없습니다. 다른 프로세스에 의해 이미 삭제되었을 수 있습니다: "${id}"`,
      );
    }

    return softDeletedReward;
  }

  async findByEventId(eventId: string): Promise<Reward[]> {
    return this.rewardModel.find({ eventId, deletedAt: null }).exec();
  }

  async softDeleteByEventId(
    eventId: string,
    userId: string,
    session?: ClientSession,
  ): Promise<void> {
    await this.rewardModel.updateMany(
      { eventId: new Types.ObjectId(eventId), deletedAt: null },
      {
        $set: {
          deletedAt: new Date(),
          deletedBy: userId,
        },
      },
      { session },
    );
  }
}
