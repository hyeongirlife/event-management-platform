import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig, AxiosError } from 'axios';
import { AuthenticatedUser } from './auth/strategies/jwt.strategy';

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
}
