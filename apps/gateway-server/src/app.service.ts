import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig, AxiosError } from 'axios';
import { AuthenticatedUser } from './auth/strategies/jwt.strategy';

// Event Server의 CreateEventDto와 유사한 인터페이스 (필요시 Gateway용 DTO로 분리)
interface CreateEventPayload {
  name: string;
  description?: string;
  condition: string;
  startDate: string;
  endDate: string;
  status?: string; // EventStatus는 Event Server에 정의되어 있으므로 string으로 받음
}

// Event Server의 UpdateEventDto (Partial<CreateEventDto>)와 유사
interface UpdateEventPayload {
  name?: string;
  description?: string;
  condition?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

// Event Server의 FindAllEventsQueryDto와 유사
interface FindAllEventsQueryPayload {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  name?: string;
  status?: string; // EventStatus 대신 string으로
  startDateAfter?: string; // ISO Date string
  startDateBefore?: string; // ISO Date string
  endDateAfter?: string; // ISO Date string
  endDateBefore?: string; // ISO Date string
}

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private authServerUrl: string;
  private eventServerUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.authServerUrl = this.configService.get<string>('AUTH_SERVER_URL');
    this.eventServerUrl = this.configService.get<string>('EVENT_SERVER_URL');

    if (!this.authServerUrl) {
      throw new Error('🔴 AUTH_SERVER_URL 이 존재하지 않습니다');
    }
    if (!this.eventServerUrl) {
      throw new Error('🔴 EVENT_SERVER_URL 이 존재하지 않습니다');
    }
  }

  /**
   * 요청을 프록시하여 다른 서비스로 전달
   * @param req - 요청 객체
   * @returns 응답 객체
   */
  async proxyRequest(
    req: Request & { user?: AuthenticatedUser },
  ): Promise<{ status: number; data: any; headers?: any }> {
    const { method, originalUrl, body, headers: clientHeaders, user } = req;

    let targetUrl = '';
    let serviceName = '';

    if (originalUrl.startsWith('/api/v1/auth')) {
      targetUrl = `${this.authServerUrl}${originalUrl.replace('/api/v1/auth', '')}`;
      serviceName = 'AuthService';
    } else if (originalUrl.startsWith('/api/v1/events')) {
      targetUrl = `${this.eventServerUrl}${originalUrl.replace('/api/v1/events', '')}`;
      serviceName = 'EventService';
    } else if (originalUrl.startsWith('/auth')) {
      targetUrl = `${this.authServerUrl}${originalUrl.replace('/auth', '')}`;
      serviceName = 'AuthService (no /api/v1 prefix)';
    } else if (originalUrl.startsWith('/events')) {
      targetUrl = `${this.eventServerUrl}${originalUrl.replace('/events', '')}`;
      serviceName = 'EventService (no /api/v1 prefix)';
    }

    if (!targetUrl) {
      if (
        originalUrl === '/' ||
        originalUrl === '/api/v1' ||
        originalUrl === '/api/v1/'
      ) {
        return {
          status: HttpStatus.OK,
          data: { message: 'Gateway is running' },
        };
      }
      throw new HttpException(
        `Cannot proxy request for path: ${originalUrl}. No matching service.`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const headersToProxy = { ...clientHeaders };
    delete headersToProxy['host'];
    delete headersToProxy['connection'];
    delete headersToProxy['content-length'];

    if (user) {
      headersToProxy['x-user-id'] = user.userId;
      headersToProxy['x-user-username'] = user.username;
      headersToProxy['x-user-roles'] = user.roles.join(',');
    }

    const axiosConfig: AxiosRequestConfig = {
      method: method as any,
      url: targetUrl,
      data: body,
      headers: headersToProxy,
    };

    this.logger.log(
      `[ProxyRequest] 게이트웨이 거쳐 요청 하는 URL: ${method} ${originalUrl} -> ${serviceName} (${targetUrl})`,
    );
    if (body && Object.keys(body).length > 0) {
      this.logger.debug(`[ProxyRequest] Request body: ${JSON.stringify(body)}`);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.request(axiosConfig),
      );
      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.isAxiosError && axiosError.response) {
        throw new HttpException(
          axiosError.response.data,
          axiosError.response.status,
        );
      }
      throw new HttpException(
        `Error proxying request to ${targetUrl}: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Event Server에 이벤트 생성 요청
   * @param userId - 사용자 ID
   * @param eventData - 이벤트 데이터
   * @returns 이벤트 생성 응답
   */
  async triggerEventCreationOnEventServer(
    userId: string,
    eventData: CreateEventPayload,
  ): Promise<any> {
    const targetUrl = `${this.eventServerUrl}/events`;
    this.logger.log(
      `[TriggerEventCreation] 직접 Event Server API 호출: POST ${targetUrl} by user ${userId}`,
    );

    const headers = {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    };

    const axiosConfig: AxiosRequestConfig = {
      method: 'POST',
      url: targetUrl,
      data: eventData,
      headers: headers,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.request(axiosConfig),
      );
      this.logger.log(
        `[TriggerEventCreation] Event Server 응답 (상태: ${response.status}): ${JSON.stringify(response.data)}`,
      );
      return response.data; // Event Server의 응답을 그대로 반환
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `[TriggerEventCreation] Event Server API 호출 오류: ${error.message}`,
        axiosError.stack,
      );
      if (axiosError.isAxiosError && axiosError.response) {
        throw new HttpException(
          axiosError.response.data,
          axiosError.response.status,
        );
      }
      throw new HttpException(
        `Error calling Event Server at ${targetUrl}: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Event Server에서 모든 이벤트 조회 요청
   * @param query - 조회 조건
   * @returns 이벤트 목록
   */
  async findAllEventsOnEventServer(
    query: FindAllEventsQueryPayload,
  ): Promise<any> {
    const targetUrl = `${this.eventServerUrl}/events`;
    this.logger.log(
      `[FindAllEvents] Event Server API 호출: GET ${targetUrl} with query ${JSON.stringify(query)}`,
    );

    const axiosConfig: AxiosRequestConfig = {
      method: 'GET',
      url: targetUrl,
      params: query, // GET 요청이므로 params로 전달
    };

    try {
      const response = await firstValueFrom(
        this.httpService.request(axiosConfig),
      );
      this.logger.log(
        `[FindAllEvents] Event Server 응답 (상태: ${response.status})`,
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `[FindAllEvents] Event Server API 호출 오류: ${error.message}`,
        axiosError.stack,
      );
      if (axiosError.isAxiosError && axiosError.response) {
        throw new HttpException(
          axiosError.response.data,
          axiosError.response.status,
        );
      }
      throw new HttpException(
        `Error calling Event Server at ${targetUrl}: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Event Server에서 특정 이벤트 조회 요청
   * @param id - 이벤트 ID
   * @returns 이벤트 상세 정보
   */
  async findOneEventOnEventServer(id: string): Promise<any> {
    const targetUrl = `${this.eventServerUrl}/events/${id}`;
    this.logger.log(`[FindOneEvent] Event Server API 호출: GET ${targetUrl}`);

    const axiosConfig: AxiosRequestConfig = {
      method: 'GET',
      url: targetUrl,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.request(axiosConfig),
      );
      this.logger.log(
        `[FindOneEvent] Event Server 응답 (상태: ${response.status}): ${JSON.stringify(response.data)}`,
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `[FindOneEvent] Event Server API 호출 오류: ${error.message}`,
        axiosError.stack,
      );
      if (axiosError.isAxiosError && axiosError.response) {
        throw new HttpException(
          axiosError.response.data,
          axiosError.response.status,
        );
      }
      throw new HttpException(
        `Error calling Event Server at ${targetUrl}: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Event Server에서 특정 이벤트 수정 요청
   * @param id - 이벤트 ID
   * @param userId - 사용자 ID
   * @param payload - 수정 데이터
   * @returns 이벤트 수정 응답
   */
  async updateEventOnEventServer(
    id: string,
    userId: string,
    payload: UpdateEventPayload,
  ): Promise<any> {
    const targetUrl = `${this.eventServerUrl}/events/${id}`;
    this.logger.log(
      `[UpdateEvent] Event Server API 호출: PATCH ${targetUrl} by user ${userId} with payload ${JSON.stringify(payload)}`,
    );

    const headers = {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    };

    const axiosConfig: AxiosRequestConfig = {
      method: 'PATCH',
      url: targetUrl,
      data: payload,
      headers: headers,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.request(axiosConfig),
      );
      this.logger.log(
        `[UpdateEvent] Event Server 응답 (상태: ${response.status}): ${JSON.stringify(response.data)}`,
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `[UpdateEvent] Event Server API 호출 오류: ${error.message}`,
        axiosError.stack,
      );
      if (axiosError.isAxiosError && axiosError.response) {
        throw new HttpException(
          axiosError.response.data,
          axiosError.response.status,
        );
      }
      throw new HttpException(
        `Error calling Event Server at ${targetUrl}: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Event Server에서 특정 이벤트 삭제 요청
   * @param id - 이벤트 ID
   * @param userId - 사용자 ID
   * @returns 이벤트 삭제 응답
   */
  async removeEventOnEventServer(id: string, userId: string): Promise<any> {
    const targetUrl = `${this.eventServerUrl}/events/${id}`;
    this.logger.log(
      `[RemoveEvent] Event Server API 호출: DELETE ${targetUrl} by user ${userId}`,
    );

    const headers = {
      'x-user-id': userId,
    };

    const axiosConfig: AxiosRequestConfig = {
      method: 'DELETE',
      url: targetUrl,
      headers: headers,
    };

    try {
      // DELETE 요청 성공 시 일반적으로 200 OK 또는 204 No Content를 반환하며, 본문이 없을 수 있음
      const response = await firstValueFrom(
        this.httpService.request(axiosConfig),
      );
      this.logger.log(
        `[RemoveEvent] Event Server 응답 (상태: ${response.status})`,
      );
      return response.data || { message: 'Event removed successfully' }; // 데이터가 없으면 성공 메시지 반환
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `[RemoveEvent] Event Server API 호출 오류: ${error.message}`,
        axiosError.stack,
      );
      if (axiosError.isAxiosError && axiosError.response) {
        throw new HttpException(
          axiosError.response.data,
          axiosError.response.status,
        );
      }
      throw new HttpException(
        `Error calling Event Server at ${targetUrl}: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
