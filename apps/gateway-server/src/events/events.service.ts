import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FindAllEventsQueryDto } from './dto/find-all-events-query.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private eventServerUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.eventServerUrl = this.configService.get<string>('EVENT_SERVER_URL');
    if (!this.eventServerUrl) {
      throw new Error('EVENT_SERVER_URL 환경변수가 필요합니다.');
    }
  }

  private extractApiVersion(req: any): string {
    const match = req.originalUrl.match(/\/api\/(v\d+)\/events/);
    return match ? match[1] : 'v1';
  }

  private buildProxyUrl(req: any, suffix: string = ''): string {
    const version = this.extractApiVersion(req);
    return `${this.eventServerUrl}/api/${version}/events${suffix}`;
  }

  private buildHeaders(req: any): Record<string, any> {
    const headers = { ...req.headers };
    delete headers['host'];
    delete headers['connection'];
    delete headers['content-length'];
    return headers;
  }

  async create(dto: CreateEventDto, req: any) {
    const url = this.buildProxyUrl(req);
    const headers = this.buildHeaders(req);
    this.logger.log(`[create] POST ${url}`);
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(url, dto, { headers }),
      );
      return data;
    } catch (error) {
      this.handleAxiosError(error, url);
    }
  }

  async findAll(query: FindAllEventsQueryDto, req: any) {
    const url = this.buildProxyUrl(req);
    const headers = this.buildHeaders(req);
    this.logger.log(`[findAll] GET ${url}`);
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(url, { headers, params: query }),
      );
      return data;
    } catch (error) {
      this.handleAxiosError(error, url);
    }
  }

  async findOne(id: string, req: any) {
    const url = this.buildProxyUrl(req, `/${id}`);
    const headers = this.buildHeaders(req);
    this.logger.log(`[findOne] GET ${url}`);
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(url, { headers }),
      );
      return data;
    } catch (error) {
      this.handleAxiosError(error, url);
    }
  }

  async update(id: string, dto: UpdateEventDto, req: any) {
    const url = this.buildProxyUrl(req, `/${id}`);
    const headers = this.buildHeaders(req);
    this.logger.log(`[update] PATCH ${url}`);
    try {
      const { data } = await firstValueFrom(
        this.httpService.patch(url, dto, { headers }),
      );
      return data;
    } catch (error) {
      this.handleAxiosError(error, url);
    }
  }

  async remove(id: string, req: any) {
    const url = this.buildProxyUrl(req, `/${id}`);
    const headers = this.buildHeaders(req);
    this.logger.log(`[remove] DELETE ${url}`);
    try {
      const { data } = await firstValueFrom(
        this.httpService.delete(url, { headers }),
      );
      return data;
    } catch (error) {
      this.handleAxiosError(error, url);
    }
  }

  private handleAxiosError(error: any, url: string): never {
    const axiosError = error as AxiosError;
    this.logger.error(
      `[EventsService] ${url} 호출 중 오류: ${axiosError.message}`,
    );
    if (axiosError.isAxiosError && axiosError.response) {
      throw new HttpException(
        axiosError.response.data,
        axiosError.response.status,
      );
    }
    throw new HttpException(
      `${url}로 프록시 요청 중 오류: ${error.message}`,
      HttpStatus.BAD_GATEWAY,
    );
  }
}
