import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
        throw new NotFoundException(`Event with ID "${eventId}" not found.`);
      }
      if ([EventStatus.ENDED, EventStatus.CANCELLED].includes(event.status)) {
        throw new BadRequestException(
          `Cannot add reward to an event that is ${event.status}.`,
        );
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          `Event with ID "${eventId}" not found or has been deleted.`,
        );
      }
      throw error;
    }

    if (type === RewardType.ITEM && !itemCode) {
      throw new BadRequestException(
        'itemCode is required for ITEM type rewards.',
      );
    }
    if (type === RewardType.COUPON && !couponCode) {
      throw new BadRequestException(
        'couponCode is required for COUPON type rewards.',
      );
    }
    if (type === RewardType.POINT && (itemCode || couponCode)) {
      throw new BadRequestException(
        'itemCode/couponCode should not be provided for POINT type rewards.',
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
      throw new BadRequestException('Invalid reward ID format.');
    }
    const reward = await this.rewardModel
      .findOne({ _id: new Types.ObjectId(id), deletedAt: null })
      .populate('eventId', 'name status')
      .exec();

    if (!reward) {
      throw new NotFoundException(
        `Reward with ID "${id}" not found or has been deleted.`,
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
      throw new BadRequestException('Invalid reward ID format.');
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
            `Cannot associate reward with an event that is ${event.status}.`,
          );
        }
        payload.eventId = new Types.ObjectId(eventId);
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw new NotFoundException(
            `New Event with ID "${eventId}" not found or has been deleted.`,
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
        'itemCode is required for ITEM type rewards.',
      );
    }
    if (newType === RewardType.COUPON && !newCouponCode) {
      throw new BadRequestException(
        'couponCode is required for COUPON type rewards.',
      );
    }
    if (newType === RewardType.POINT && (newItemCode || newCouponCode)) {
      throw new BadRequestException(
        'itemCode/couponCode should not be provided for POINT type rewards.',
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
            `Cannot update reward details for an event that is ${linkedEvent.status}.`,
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
        `Reward with ID "${id}" not found, has been deleted, or an issue occurred during update.`,
      );
    }
    return updatedReward;
  }

  async remove(id: string, userId: string): Promise<Reward> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid reward ID format.');
    }

    const currentReward = await this.rewardModel.findOne({
      _id: new Types.ObjectId(id),
      deletedAt: null,
    });

    if (!currentReward) {
      throw new NotFoundException(
        `Reward with ID "${id}" not found or already deleted.`,
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
        `Reward with ID "${id}" could not be deleted. It might have been deleted by another process.`,
      );
    }

    return softDeletedReward;
  }
}
