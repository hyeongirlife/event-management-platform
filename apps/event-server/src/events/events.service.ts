import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { FilterQuery, Model, Connection, ClientSession } from 'mongoose';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event, EventDocument, EventStatus } from './schemas/event.schema';
import {
  FindAllEventsQueryDto,
  SortOrder,
} from './dto/find-all-events-query.dto';

// Define a response structure for paginated results
export interface PaginatedEventsResponse {
  data: Event[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(
    createEventDto: CreateEventDto,
    userId?: string,
    session?: ClientSession,
  ): Promise<Event> {
    const eventToCreate = {
      ...createEventDto,
      startDate: new Date(createEventDto.startDate),
      endDate: new Date(createEventDto.endDate),
      ...(userId && { createdBy: userId }), // userId가 제공되면 createdBy 설정
    };
    const createdEvent = new this.eventModel(eventToCreate);
    return createdEvent.save({ session });
  }

  async findAll(
    queryDto: FindAllEventsQueryDto,
  ): Promise<PaginatedEventsResponse> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = SortOrder.DESC,
      name,
      status,
      startDateAfter,
      startDateBefore,
      endDateAfter,
      endDateBefore,
    } = queryDto;

    const skip = (page - 1) * limit;

    const filter: FilterQuery<EventDocument> = {
      deletedAt: null, // 기본적으로 삭제되지 않은 문서만 조회
    };

    if (name) {
      filter.name = { $regex: name, $options: 'i' }; // Case-insensitive partial match
    }
    if (status) {
      filter.status = status;
    }

    // 날짜 필터 생성 함수
    const createDateFilter = (afterDate?: Date, beforeDate?: Date) => {
      const dateFilter: any = {};
      if (afterDate) dateFilter.$gte = afterDate;
      if (beforeDate) dateFilter.$lte = beforeDate;
      return Object.keys(dateFilter).length > 0 ? dateFilter : null;
    };

    // startDate 필터 적용
    const startDateFilter = createDateFilter(startDateAfter, startDateBefore);
    if (startDateFilter) {
      filter.startDate = startDateFilter;
    }

    // endDate 필터 적용
    const endDateFilter = createDateFilter(endDateAfter, endDateBefore);
    if (endDateFilter) {
      filter.endDate = endDateFilter;
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === SortOrder.ASC ? 1 : -1;

    const total = await this.eventModel.countDocuments(filter).exec();
    const data = await this.eventModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
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

  async findOne(id: string): Promise<Event> {
    const event = await this.eventModel
      .findOne({ _id: id, deletedAt: null })
      .exec();
    if (!event) {
      throw new NotFoundException(
        `${id}에 해당하는 이벤트를 찾을 수 없습니다. 또는 이미 삭제되었을 수 있습니다.`,
      );
    }
    return event;
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    userId?: string,
    session?: ClientSession,
  ): Promise<Event> {
    // 1. 현재 이벤트 정보 조회 (deletedAt: null 조건 포함)
    const currentEvent = await this.findOne(id);

    // 2. 요청 DTO에 status가 있고, 현재 상태와 다른 경우 상태 변경 로직 적용
    if (
      updateEventDto.status &&
      updateEventDto.status !== currentEvent.status
    ) {
      const newStatus = updateEventDto.status;
      switch (currentEvent.status) {
        case EventStatus.SCHEDULED:
          if (
            ![EventStatus.ACTIVE, EventStatus.CANCELLED].includes(newStatus)
          ) {
            throw new BadRequestException(
              `'SCHEDULED' 상태의 이벤트는 'ACTIVE' 또는 'CANCELLED' 상태로만 변경 가능합니다.`,
            );
          }
          break;
        case EventStatus.ACTIVE:
          if (![EventStatus.ENDED, EventStatus.CANCELLED].includes(newStatus)) {
            throw new BadRequestException(
              `'ACTIVE' 상태의 이벤트는 'ENDED' 또는 'CANCELLED' 상태로만 변경 가능합니다.`,
            );
          }
          break;
        case EventStatus.ENDED:
        case EventStatus.CANCELLED:
          throw new BadRequestException(
            `'${currentEvent.status}' 상태의 이벤트는 상태를 변경할 수 없습니다.`,
          );
        default:
          // 혹시 모를 새로운 상태값에 대한 처리 (일반적으로는 발생하지 않음)
          throw new BadRequestException('알 수 없는 현재 이벤트 상태입니다.');
      }
    }

    const payload: any = { ...updateEventDto };

    if (
      updateEventDto.startDate &&
      typeof updateEventDto.startDate === 'string'
    ) {
      payload.startDate = new Date(updateEventDto.startDate);
    }
    if (updateEventDto.endDate && typeof updateEventDto.endDate === 'string') {
      payload.endDate = new Date(updateEventDto.endDate);
    }

    if (userId) {
      payload.updatedBy = userId;
    }

    // 업데이트 전 startDate와 endDate 유효성 재검증 (Mongoose 스키마 pre-save 훅이 findOneAndUpdate에는 기본적으로 실행되지 않음)
    // 스키마 옵션에 runValidators: true를 주거나, 여기서 직접 검증 필요.
    // 여기서는 payload에 변환된 Date 객체가 있으므로, 스키마 pre-save 로직과 유사하게 검증 가능
    // const tempDocForValidation = new this.eventModel({ ...currentEvent, ...payload }); // 이 줄 삭제
    // Mongoose 6.x부터는 new this.eventModel(doc).validateSync() 가 아니라, Document.prototype.validate() 사용.
    // 또는 더 간단히는 아래와 같이 직접 비교:
    const finalStartDate = payload.startDate || currentEvent.startDate;
    const finalEndDate = payload.endDate || currentEvent.endDate;
    if (finalStartDate && finalEndDate && finalStartDate > finalEndDate) {
      throw new BadRequestException('시작일은 종료일보다 늦을 수 없습니다.');
    }

    const updatedEvent = await this.eventModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, payload, {
        new: true,
        session,
      })
      .exec();

    if (!updatedEvent) {
      throw new NotFoundException(
        `${id}에 해당하는 이벤트를 찾을 수 없습니다. 또는 이미 삭제되었거나 업데이트 중 문제가 발생했습니다.`,
      );
    }
    return updatedEvent;
  }

  async remove(
    id: string,
    userId?: string,
    session?: ClientSession,
  ): Promise<Event> {
    const updatePayload: { deletedAt: Date; deletedBy?: string } = {
      deletedAt: new Date(),
    };
    if (userId) {
      updatePayload.deletedBy = userId;
    }

    const softDeletedEvent = await this.eventModel
      .findByIdAndUpdate(id, { $set: updatePayload }, { new: true, session })
      .exec();

    if (!softDeletedEvent) {
      throw new NotFoundException(
        `${id}에 해당하는 이벤트를 찾을 수 없습니다. 또는 이미 삭제되었을 수 있습니다.`,
      );
    }
    // 실제로는 softDeletedEvent는 삭제된 상태의 문서이므로, 반환값을 어떻게 할지 고려 필요
    // 예를 들어, 삭제 성공 메시지를 반환하거나, 주요 필드만 포함된 객체를 반환할 수 있음
    // 여기서는 일단 수정된 문서를 반환
    return softDeletedEvent;
  }
}
