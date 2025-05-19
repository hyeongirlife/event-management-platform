import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserRewardEntry,
  UserRewardEntryStatus,
} from './schemas/user-reward-entry.schema';
import { Event, EventStatus } from '../events/schemas/event.schema';
import { Reward } from '../rewards/schemas/reward.schema';
import { EventsService } from '../events/events.service';
import { ClaimRewardDto } from './dto/claim-reward.dto';
import { FindUserRewardsQueryDto } from './dto/find-user-rewards-query.dto';
import { FindAllUserRewardEntriesQueryDto } from './dto/find-all-user-reward-entries-query.dto';

@Injectable()
export class UserRewardsService {
  private readonly logger = new Logger(UserRewardsService.name);

  constructor(
    @InjectModel(UserRewardEntry.name)
    private userRewardEntryModel: Model<UserRewardEntry>,
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectModel(Reward.name) private rewardModel: Model<Reward>,
    private readonly eventsService: EventsService,
  ) {}

  async findUserRewards(
    userId: string,
    queryDto: FindUserRewardsQueryDto,
  ): Promise<{
    data: UserRewardEntry[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      eventId,
      status,
    } = queryDto;

    const filters: any = { userId };
    if (eventId) {
      filters.eventId = new Types.ObjectId(eventId);
    }
    if (status) {
      filters.status = status;
    }

    const sortOptions: { [key: string]: 1 | -1 } = {};
    sortOptions[sortBy] = sortOrder === 'DESC' ? -1 : 1;

    const skip = (page - 1) * limit;

    try {
      const [data, total] = await Promise.all([
        this.userRewardEntryModel
          .find(filters)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .populate('eventId')
          .populate('grantedRewards')
          .exec(),
        this.userRewardEntryModel.countDocuments(filters).exec(),
      ]);

      return { data, total, page, limit };
    } catch (error) {
      this.logger.error(
        `Failed to find user rewards for user ${userId} with query ${JSON.stringify(queryDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve user rewards.',
      );
    }
  }

  async claimReward(
    userId: string,
    claimRewardDto: ClaimRewardDto,
  ): Promise<UserRewardEntry> {
    const { eventId } = claimRewardDto;
    const eventObjectId = new Types.ObjectId(eventId);

    const event = await this.eventModel
      .findOne({ _id: eventObjectId, deletedAt: null })
      .exec();
    if (!event) {
      throw new NotFoundException(
        `해당 이벤트를 찾을 수 없습니다: "${eventId}"`,
      );
    }
    if (event.status !== EventStatus.ACTIVE) {
      throw new ConflictException(
        `이벤트가 활성 상태가 아닙니다. 현재 상태: ${event.status}`,
      );
    }

    const existingEntry = await this.userRewardEntryModel
      .findOne({ userId, eventId: eventObjectId })
      .exec();
    if (existingEntry) {
      this.logger.warn(
        `사용자 ${userId}가 이벤트 ${eventId}에 이미 보상 요청을 했습니다. 현재 상태: ${existingEntry.status}`,
      );
      throw new ConflictException('이미 해당 이벤트에 보상을 요청하셨습니다.');
    }

    const meetsCondition = await this.validateEventCondition(userId, event);
    if (!meetsCondition) {
      const failedEntry = new this.userRewardEntryModel({
        userId,
        eventId: eventObjectId,
        status: UserRewardEntryStatus.VALIDATION_FAILED,
        failureReason: '이벤트 조건을 만족하지 않습니다.',
        createdBy: userId,
      });
      try {
        return await failedEntry.save();
      } catch (error) {
        this.logger.error(
          `VALIDATION_FAILED 엔트리 저장 실패: 사용자 ${userId}, 이벤트 ${eventId}`,
          error.stack,
        );
        throw new InternalServerErrorException(
          '보상 요청 기록 중 오류가 발생했습니다.',
        );
      }
    }

    const rewardsToGrant = await this.rewardModel
      .find({ eventId: eventObjectId, deletedAt: null })
      .exec();
    if (!rewardsToGrant || rewardsToGrant.length === 0) {
      this.logger.warn(`이벤트 ${eventId}에 지급 가능한 보상이 없습니다.`);
      const noRewardEntry = new this.userRewardEntryModel({
        userId,
        eventId: eventObjectId,
        status: UserRewardEntryStatus.VALIDATION_FAILED,
        failureReason: '이벤트에 지급 가능한 보상이 없습니다.',
        createdBy: userId,
        validatedAt: new Date(),
      });
      try {
        return await noRewardEntry.save();
      } catch (error) {
        this.logger.error(
          `NO_REWARD_AVAILABLE 엔트리 저장 실패: 사용자 ${userId}, 이벤트 ${eventId}`,
          error.stack,
        );
        throw new InternalServerErrorException(
          '보상 요청 기록 중 오류가 발생했습니다.',
        );
      }
    }

    const grantedRewardIds = rewardsToGrant.map((r) => r._id);
    const grantedRewardDetails = rewardsToGrant.map((r) => ({
      rewardId: r._id.toHexString(),
      name: r.name,
      type: r.type,
      quantity: r.quantity,
    }));

    const newEntry = new this.userRewardEntryModel({
      userId,
      eventId: eventObjectId,
      status: UserRewardEntryStatus.PENDING_PAYOUT,
      createdBy: userId,
      validatedAt: new Date(),
      grantedRewards: grantedRewardIds,
      grantedRewardDetails: grantedRewardDetails,
    });

    try {
      const savedEntry = await newEntry.save();
      this.logger.log(
        `사용자 ${userId}가 이벤트 ${eventId}에 보상 요청 성공. 엔트리 ID: ${savedEntry._id}`,
      );
      // Placeholder for actual payout logic: await this.payoutRewards(savedEntry);
      return savedEntry;
    } catch (error) {
      if (error.code === 11000) {
        this.logger.warn(
          `중복 보상 요청(DB 레벨): 사용자 ${userId}, 이벤트 ${eventId}`,
          error.message,
        );
        throw new ConflictException(
          '이미 해당 이벤트에 보상을 요청하셨습니다.',
        );
      }
      this.logger.error(
        `PENDING_PAYOUT 엔트리 저장 실패: 사용자 ${userId}, 이벤트 ${eventId}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        '보상 요청 기록 중 오류가 발생했습니다.',
      );
    }
  }

  private async validateEventCondition(
    userId: string,
    eventFromMethodArg: Event,
  ): Promise<boolean> {
    const event = eventFromMethodArg as Event & { _id: Types.ObjectId };

    this.logger.debug(
      `Validating condition for user ${userId}, event "${event.name}" (ID: ${event._id}). Condition: "${event.condition}"`,
    );

    if (
      !event.condition ||
      typeof event.condition !== 'string' ||
      event.condition.trim() === ''
    ) {
      this.logger.log(
        `No specific condition defined for event "${event.name}" (ID: ${event._id}). Assuming condition met.`,
      );
      return true;
    }

    // TODO: Implement actual event condition parsing and validation logic here.
    // The 'event.condition' string needs to be parsed and evaluated against the user's state or other criteria.
    // For example, if event.condition is "USER_LEVEL_GTE_10":
    //   - Fetch user's level (requires access to user data, potentially another service or DB query).
    //   - Compare user's level with 10.
    //   - Return true if level >= 10, false otherwise.
    // If event.condition is a JSON string, parse it and process accordingly.

    this.logger.log(
      `Placeholder validation for event "${event.name}" (ID: ${event._id}). Condition "${event.condition}" is assumed to be met for now.`,
    );
    return true;
  }

  // Optional payout logic placeholder (can be a separate service or method)
  // private async payoutRewards(entry: UserRewardEntry): Promise<void> {
  //   this.logger.log(`Processing payout for entry ${entry._id}, user ${entry.userId}`);
  //   try {
  //     // TODO: Implement actual reward payout (e.g., call points service, item service)
  //     entry.status = UserRewardEntryStatus.REWARDED;
  //     entry.rewardedAt = new Date();
  //     await entry.save();
  //     this.logger.log(`Payout successful for entry ${entry._id}. Status: REWARDED`);
  //   } catch (payoutError) {
  //     this.logger.error(`Payout failed for entry ${entry._id}`, payoutError.stack);
  //     entry.status = UserRewardEntryStatus.FAILED_PAYOUT;
  //     entry.failureReason = payoutError.message || 'Payout system error';
  //     await entry.save();
  //   }
  // }

  async findAllUserRewardEntries(
    queryDto: FindAllUserRewardEntriesQueryDto,
  ): Promise<{
    data: UserRewardEntry[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      userId,
      eventId,
      status,
    } = queryDto;

    const filters: any = {};
    if (userId) {
      filters.userId = userId;
    }
    if (eventId) {
      filters.eventId = new Types.ObjectId(eventId);
    }
    if (status) {
      filters.status = status;
    }

    const sortOptions: { [key: string]: 1 | -1 } = {};
    sortOptions[sortBy] = sortOrder === 'DESC' ? -1 : 1;

    const skip = (page - 1) * limit;

    try {
      const [data, total] = await Promise.all([
        this.userRewardEntryModel
          .find(filters)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .populate('eventId')
          .populate('grantedRewards')
          .exec(),
        this.userRewardEntryModel.countDocuments(filters).exec(),
      ]);

      return { data, total, page, limit };
    } catch (error) {
      this.logger.error(
        `Failed to find all user reward entries with query ${JSON.stringify(queryDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve user reward entries.',
      );
    }
  }
}
