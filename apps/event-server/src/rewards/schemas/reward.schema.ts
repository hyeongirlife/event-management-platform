import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { Event } from '../../events/schemas/event.schema'; // 연결할 Event 스키마 임포트

// 보상 타입을 나타내는 Enum (확장 가능)
export enum RewardType {
  POINT = 'POINT',
  ITEM = 'ITEM', // 아이템의 경우, 아이템 ID나 코드 등을 추가로 저장할 수 있음
  COUPON = 'COUPON', // 쿠폰의 경우, 쿠폰 코드 등을 추가로 저장할 수 있음
  // OTHER = 'OTHER',
}

export type RewardDocument = HydratedDocument<Reward>;

@Schema({ timestamps: true, collection: 'rewards' })
export class Reward {
  @Prop({ required: true, trim: true })
  name: string; // 보상 이름 (예: "1000 포인트 지급", "경험치 부스터 (1시간)")

  @Prop({
    required: true,
    type: String,
    enum: Object.values(RewardType),
  })
  type: RewardType; // 보상 타입

  @Prop({ required: true, type: Number, min: 0 }) // 수량은 0 이상이어야 함
  quantity: number; // 보상 수량 (예: 포인트 값, 아이템 개수)

  @Prop({ trim: true })
  description?: string; // 보상에 대한 추가 설명 (선택 사항)

  // POINT 외 다른 타입에 대한 추가 정보 필드 (선택적)
  @Prop({ trim: true })
  itemCode?: string; // RewardType.ITEM 일 경우 아이템 식별 코드

  @Prop({ trim: true })
  couponCode?: string; // RewardType.COUPON 일 경우 쿠폰 식별 코드

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true, index: true }) // Event 스키마와 연결
  eventId: Types.ObjectId; // 이 보상이 속한 이벤트의 ID

  @Prop({ type: String, required: false })
  createdBy?: string; // 보상을 생성한 사용자 ID

  @Prop({ type: String, required: false })
  updatedBy?: string; // 보상을 마지막으로 수정한 사용자 ID

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null; // 논리적 삭제 일시

  @Prop({ type: String, required: false, default: null })
  deletedBy?: string | null; // 보상을 삭제한 사용자 ID

  // 보상 지급 조건 (이벤트 전체 조건과 별개로 보상마다 조건이 다를 수 있다면)
  // @Prop({ type: String })
  // condition?: string; // 예: "이벤트 기간 내 5회 이상 참여 시"
}

export const RewardSchema = SchemaFactory.createForClass(Reward);

// 복합 인덱스
RewardSchema.index({ eventId: 1, type: 1, deletedAt: 1 }); // deletedAt 고려
RewardSchema.index({ type: 1, deletedAt: 1 });
RewardSchema.index({ deletedAt: 1 });

// 유효성 검사: 보상 유형에 따른 필수 필드 검증 (예: ITEM 타입이면 itemCode 필수)
// 스키마 레벨 또는 서비스 레벨에서 처리 가능. 여기서는 서비스 레벨에서 처리하는 것을 권장.
// RewardSchema.pre<RewardDocument>('save', function (next) {
//   if (this.type === RewardType.ITEM && !this.itemCode) {
//     return next(new Error('ITEM 타입의 보상에는 itemCode가 필요합니다.'));
//   }
//   if (this.type === RewardType.COUPON && !this.couponCode) {
//     return next(new Error('COUPON 타입의 보상에는 couponCode가 필요합니다.'));
//   }
//   next();
// });
