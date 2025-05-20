import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
// import { Event } from '../../events/schemas/event.schema'; // Event 스키마는 직접 참조하지 않으므로 주석 처리 또는 삭제
// import { Reward } from '../../rewards/schemas/reward.schema'; // Reward 스키마는 직접 참조하지 않으므로 주석 처리 또는 삭제

// 사용자 보상 요청 처리 상태 Enum
export enum UserRewardEntryStatus {
  REQUESTED = 'REQUESTED', // 사용자가 보상 요청 (조건 검증 전)
  PENDING_VALIDATION = 'PENDING_VALIDATION', // 조건 검증 진행 중 (필요시 사용)
  VALIDATION_FAILED = 'VALIDATION_FAILED', // 조건 검증 실패
  PENDING_PAYOUT = 'PENDING_PAYOUT', // 조건 검증 성공, 보상 지급 대기 중
  REWARDED = 'REWARDED', // 보상 지급 성공
  FAILED_PAYOUT = 'FAILED_PAYOUT', // 보상 지급 실패 (지급 시스템 오류 등)
  DUPLICATE_REQUEST = 'DUPLICATE_REQUEST', // 중복 요청 (이미 처리된 요청이 있을 경우)
}

@Schema({ timestamps: true, collection: 'user_reward_entries' })
export class UserRewardEntry extends Document {
  @Prop({ required: true, type: String, index: true })
  userId: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Event', // Event 모델 이름 문자열로 참조
    required: true,
    index: true,
  })
  eventId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    enum: UserRewardEntryStatus,
    required: true,
    default: UserRewardEntryStatus.REQUESTED,
    index: true,
  })
  status: UserRewardEntryStatus;

  @Prop({ type: Date })
  validatedAt?: Date;

  @Prop({ type: Date })
  rewardedAt?: Date;

  @Prop({ type: String })
  failureReason?: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Reward' }] }) // Reward 모델 이름 문자열로 참조
  grantedRewards?: MongooseSchema.Types.ObjectId[];

  @Prop({ type: [MongooseSchema.Types.Mixed] })
  grantedRewardDetails?: Record<string, any>[];

  @Prop({ type: MongooseSchema.Types.Mixed })
  validationDetails?: Record<string, any>;

  @Prop({ type: String })
  createdBy?: string;

  @Prop({ type: String })
  updatedBy?: string;

  // Mongoose timestamps 옵션에 의해 자동 생성되지만, 타입 추론을 위해 명시
  createdAt: Date;
  updatedAt: Date;
}

export const UserRewardEntrySchema =
  SchemaFactory.createForClass(UserRewardEntry);

UserRewardEntrySchema.index({ userId: 1, eventId: 1 }, { unique: true });
UserRewardEntrySchema.index({ status: 1, updatedAt: -1 });
