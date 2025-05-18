import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

// 이벤트 상태를 나타내는 Enum
export enum EventStatus {
  SCHEDULED = 'SCHEDULED', // 등록되었으나 아직 시작되지 않은 상태
  ACTIVE = 'ACTIVE', // 현재 진행 중인 이벤트
  ENDED = 'ENDED', // 정상적으로 종료된 이벤트
  CANCELLED = 'CANCELLED', // 운영자에 의해 취소된 이벤트
}

export type EventDocument = HydratedDocument<Event>;

@Schema({ timestamps: true, collection: 'events' }) // timestamps: createdAt, updatedAt 자동 생성, collection: MongoDB 컬렉션 이름 명시
export class Event {
  @Prop({ required: true, trim: true, unique: true }) // 이벤트 이름은 고유해야 할 수 있음 (요구사항에 따라)
  name: string; // 이벤트 이름

  @Prop({ trim: true })
  description?: string; // 이벤트 설명 (선택 사항)

  @Prop({ required: true, type: String })
  condition: string; // 이벤트 참여 조건 또는 보상 달성 조건 (텍스트 기반)
  // 예: "3일 연속 로그인", "친구 3명 이상 초대"

  @Prop({ required: true, type: Date })
  startDate: Date; // 이벤트 시작일시

  @Prop({ required: true, type: Date })
  endDate: Date; // 이벤트 종료일시

  @Prop({
    required: true,
    type: String,
    enum: Object.values(EventStatus), // Enum 값들로 제한
    default: EventStatus.SCHEDULED,
  })
  status: EventStatus; // 이벤트 현재 상태

  @Prop({ type: String, required: false })
  createdBy?: string; // 이벤트를 생성한 사용자 ID (Gateway에서 X-User-Id 통해 전달)

  @Prop({ type: String, required: false })
  updatedBy?: string; // 이벤트를 마지막으로 수정한 사용자 ID (Gateway에서 X-User-Id 통해 전달)

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null; // 논리적 삭제 일시 (null이면 삭제되지 않음)

  @Prop({ type: String, required: false, default: null })
  deletedBy?: string | null; // 이벤트를 삭제한 사용자 ID

  // 향후 확장을 위해 생성자/수정자 ID 등을 저장할 수 있습니다.
  // 예: @Prop({ type: String }) createdBy: string; (Gateway에서 받은 X-User-Id)
}

export const EventSchema = SchemaFactory.createForClass(Event);

// 자주 사용될 쿼리를 위한 인덱스 설정 (선택 사항이지만 권장)
EventSchema.index({ name: 1, deletedAt: 1 }); // 이름으로 검색 (deletedAt 고려)
EventSchema.index({ status: 1, startDate: -1, endDate: -1, deletedAt: 1 }); // 상태 및 기간 복합 인덱스 (deletedAt 고려)
EventSchema.index({ endDate: 1, status: 1, deletedAt: 1 }); // 종료된 이벤트 중 특정 상태, 스케줄러 (deletedAt 고려)
EventSchema.index({ deletedAt: 1 }); // 삭제되지 않은 문서를 찾는 쿼리에 사용

// 시작일이 종료일보다 늦을 수 없도록 하는 유효성 검사 (선택적, Mongoose 레벨 또는 서비스 레벨)
EventSchema.pre<EventDocument>('save', function (next) {
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    next(new Error('시작일은 종료일보다 늦을 수 없습니다.'));
  } else {
    next();
  }
});
