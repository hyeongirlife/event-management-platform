import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { ClaimRewardDto } from './dto/claim-reward.dto';
import { FindUserRewardsQueryDto } from './dto/find-user-rewards-query.dto';
import { FindAllUserRewardEntriesQueryDto } from './dto/find-all-user-reward-entries-query.dto';

@Injectable()
export class UserRewardsService {
  private readonly logger = new Logger(UserRewardsService.name);
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
    const match = req.originalUrl.match(/\/api\/(v\d+)\/user-rewards/);
    return match ? match[1] : 'v1';
  }

  private buildProxyUrl(req: any, suffix: string = ''): string {
    const version = this.extractApiVersion(req);
    return `${this.eventServerUrl}/api/${version}/user-rewards${suffix}`;
  }

  private buildHeaders(req: any): Record<string, any> {
    const headers = { ...req.headers };
    delete headers['host'];
    delete headers['connection'];
    delete headers['content-length'];
    return headers;
  }

  async findAllUserEntries(query: FindAllUserRewardEntriesQueryDto, req: any) {
    const url = this.buildProxyUrl(req, '/admin');
    const headers = this.buildHeaders(req);
    this.logger.log(`[findAllUserEntries] GET ${url}`);
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(url, { headers, params: query }),
      );
      return data;
    } catch (error) {
      this.handleAxiosError(error, url);
    }
  }

  async findMyRewards(req: any, query: FindUserRewardsQueryDto) {
    const url = this.buildProxyUrl(req, '/me');
    const headers = this.buildHeaders(req);
    this.logger.log(`[findMyRewards] GET ${url}`);
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(url, { headers, params: query }),
      );
      return data;
    } catch (error) {
      this.handleAxiosError(error, url);
    }
  }

  async claimReward(req: any, dto: ClaimRewardDto) {
    const url = this.buildProxyUrl(req, '/claim');
    const headers = this.buildHeaders(req);
    this.logger.log(`[claimReward] POST ${url}`);
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(url, dto, { headers }),
      );
      return data;
    } catch (error) {
      this.handleAxiosError(error, url);
    }
  }

  private handleAxiosError(error: any, url: string): never {
    const axiosError = error as AxiosError;
    this.logger.error(
      `[UserRewardsService] ${url} 호출 중 오류: ${axiosError.message}`,
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
