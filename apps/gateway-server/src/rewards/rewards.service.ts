import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);
  private eventServerUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.eventServerUrl = this.configService.get<string>('EVENT_SERVER_URL');
    if (!this.eventServerUrl) {
      throw new Error('🔴 EVENT_SERVER_URL 이 존재하지 않습니다');
    }
  }

  private buildHeaders(req: any): Record<string, any> {
    const headers = { ...req.headers };
    delete headers['host'];
    delete headers['connection'];
    delete headers['content-length'];
    if (req.user) {
      headers['x-user-id'] = req.user.userId;
      headers['x-user-username'] = req.user.username;
      headers['x-user-roles'] = Array.isArray(req.user.roles)
        ? req.user.roles.join(',')
        : req.user.roles;
    }
    return headers;
  }

  private extractApiVersion(req: any): string {
    // /api/v1/rewards, /api/v2/rewards 등에서 v1, v2 추출
    const match = req.originalUrl.match(/\/api\/(v\d+)\/rewards/);
    return match ? match[1] : 'v1'; // 기본 v1
  }

  private buildProxyUrl(req: any, suffix: string = ''): string {
    const version = this.extractApiVersion(req);
    // /api/v1/rewards, /api/v2/rewards 등으로 event-server에 프록시
    return `${this.eventServerUrl}/api/${version}/rewards${suffix}`;
  }

  async createReward(createRewardDto: any, req: any) {
    const url = this.buildProxyUrl(req);
    const headers = this.buildHeaders(req);
    this.logger.log(`[createReward] POST ${url}`);
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(url, createRewardDto, { headers }),
      );
      return data;
    } catch (error) {
      this.handleAxiosError(error, url);
    }
  }

  async findAllRewards(query: any, req: any) {
    const url = this.buildProxyUrl(req);
    const headers = this.buildHeaders(req);
    this.logger.log(
      `[findAllRewards] GET ${url} with query ${JSON.stringify(query)}`,
    );
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(url, { params: query, headers }),
      );
      return data;
    } catch (error) {
      this.handleAxiosError(error, url);
    }
  }

  async findRewardById(id: string, req: any) {
    const url = this.buildProxyUrl(req, `/${id}`);
    const headers = this.buildHeaders(req);
    this.logger.log(`[findRewardById] GET ${url}`);
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(url, { headers }),
      );
      return data;
    } catch (error) {
      this.handleAxiosError(error, url);
    }
  }

  async updateReward(id: string, updateRewardDto: any, req: any) {
    const url = this.buildProxyUrl(req, `/${id}`);
    const headers = this.buildHeaders(req);
    this.logger.log(`[updateReward] PATCH ${url}`);
    try {
      const { data } = await firstValueFrom(
        this.httpService.patch(url, updateRewardDto, { headers }),
      );
      return data;
    } catch (error) {
      this.handleAxiosError(error, url);
    }
  }

  async deleteReward(id: string, req: any) {
    const url = this.buildProxyUrl(req, `/${id}`);
    const headers = this.buildHeaders(req);
    this.logger.log(`[deleteReward] DELETE ${url}`);
    try {
      const { data } = await firstValueFrom(
        this.httpService.delete(url, { headers }),
      );
      return data;
    } catch (error) {
      this.handleAxiosError(error, url);
    }
  }

  async findRewardsByEvent(eventId: string, req: any) {
    const version = this.extractApiVersion(req);
    const url = `${this.eventServerUrl}/api/${version}/rewards/by-event/${eventId}`;
    const headers = this.buildHeaders(req);
    this.logger.log(`[findRewardsByEvent] GET ${url}`);
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(url, { headers }),
      );
      return data;
    } catch (error) {
      this.handleAxiosError(error, url);
    }
  }

  private handleAxiosError(error: any, url: string): never {
    const axiosError = error as AxiosError;
    this.logger.error(
      `[RewardsService] ${url} 호출 중 오류: ${axiosError.message}`,
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
