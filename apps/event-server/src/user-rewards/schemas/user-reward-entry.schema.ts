import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { Event } from '../../events/schemas/event.schema';
import { Reward } from '../../rewards/schemas/reward.schema'; // 지급된 보상 정보 연결 (선택적)

// 유저 보상 요청 상태
export enum UserRewardEntryStatus {
  REQUESTED = 'REQUESTED', // 보상 요청됨 (조건 검증 전)
  PENDING_VALIDATION = 'PENDING_VALIDATION', // 조건 검증 중
  VALIDATION_FAILED = 'VALIDATION_FAILED', // 조건 미충족으로 실패
  PENDING_PAYOUT = 'PENDING_PAYOUT', // 조건 충족, 보상 지급 대기
  REWARDED = 'REWARDED', // 보상 지급 완료
  FAILED_PAYOUT = 'FAILED_PAYOUT', // 보상 지급 실패 (시스템 오류 등)
  DUPLICATE_REQUEST = 'DUPLICATE_REQUEST', // 중복 요청
  // CANCELLED_BY_USER = 'CANCELLED_BY_USER', // 사용자에 의한 요청 취소 (필요시)
  // CANCELLED_BY_SYSTEM = 'CANCELLED_BY_SYSTEM', // 시스템에 의한 취소 (이벤트 취소 등)
}

export type UserRewardEntryDocument = HydratedDocument<UserRewardEntry>;

@Schema({ timestamps: true, collection: 'user_reward_entries' })
export class UserRewardEntry {
  @Prop({ required: true, index: true }) // Gateway에서 받은 X-User-Id
  userId: string;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true, index: true })
  eventId: Types.ObjectId;

  // 사용자가 특정 보상을 선택해서 요청하는 경우 Reward ID도 저장할 수 있음
  // @Prop({ type: Types.ObjectId, ref: 'Reward', index: true })
  // requestedRewardId?: Types.ObjectId;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(UserRewardEntryStatus),
    default: UserRewardEntryStatus.REQUESTED,
  })
  status: UserRewardEntryStatus;

  @Prop({ type: Date }) // 조건 검증 완료 시간
  validatedAt?: Date;

  @Prop({ type: Date }) // 보상 지급 완료 시간
  rewardedAt?: Date;

  @Prop({ type: String }) // 조건 검증 실패 또는 지급 실패 사유
  failureReason?: string;

  // 실제 지급된 보상 내역 (여러 개일 수 있으므로 배열 또는 별도 스키마 참조)
  // 이 부분은 보상이 단일 아이템/포인트로 고정적인지, 여러 개 중 선택인지 등에 따라 설계 변경 가능
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Reward' }] })
  grantedRewards?: Types.ObjectId[]; // 실제 지급된 Reward ID 목록

  @Prop({ type: Object }) // 지급된 보상의 상세 내용 (스냅샷, 예: { type: 'POINT', quantity: 100 })
  grantedRewardDetails?: Record<string, any>; // 또는 명확한 인터페이스/타입 정의

  // 트랜잭션 ID 또는 외부 시스템 연동 ID (필요시)
  // @Prop({ type: String, index: true })
  // transactionId?: string;
}

export const UserRewardEntrySchema =
  SchemaFactory.createForClass(UserRewardEntry);

// 중복 보상 요청을 막기 위한 복합 고유 인덱스 (userId, eventId 조합)
// 만약 eventId 내에서도 여러번 참여/보상 요청이 가능하다면 이 인덱스는 부적합.
// "유저는 특정 이벤트에 대해 보상을 요청할 수 있어야 합니다." -> 이벤트당 1회 요청으로 해석
UserRewardEntrySchema.index({ userId: 1, eventId: 1 }, { unique: true });

UserRewardEntrySchema.index({ status: 1, updatedAt: -1 }); // 특정 상태의 항목을 최근 업데이트 순으로 조회
