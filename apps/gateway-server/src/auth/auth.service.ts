import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { LoginDto, RegisterDto } from './auth.controller';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private authServerUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.authServerUrl = this.configService.get<string>('AUTH_SERVER_URL');
    if (!this.authServerUrl) {
      throw new Error('🔴 AUTH_SERVER_URL 이 존재하지 않습니다');
    }
  }

  private extractApiVersion(req: any): string {
    // /api/v1/auth, /api/v2/auth 등에서 v1, v2 추출
    const match = req.originalUrl.match(/\/api\/(v\d+)\/auth/);
    return match ? match[1] : 'v1'; // 기본 v1
  }

  private buildProxyUrl(req: any, suffix: string = ''): string {
    const version = this.extractApiVersion(req);
    // /api/v1/auth, /api/v2/auth 등으로 auth-server에 프록시
    return `${this.authServerUrl}/api/${version}/auth${suffix}`;
  }

  private buildHeaders(req: any): Record<string, any> {
    const headers = { ...req.headers };
    delete headers['host'];
    delete headers['connection'];
    delete headers['content-length'];
    return headers;
  }

  async login(loginDto: LoginDto, req: any) {
    const url = this.buildProxyUrl(req, '/login');
    const headers = this.buildHeaders(req);
    this.logger.log(`[login] POST ${url}`);
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(url, loginDto, { headers }),
      );
      return data;
    } catch (error) {
      this.handleAxiosError(error, url);
    }
  }

  async register(registerDto: RegisterDto, req: any) {
    const url = this.buildProxyUrl(req, '/register');
    const headers = this.buildHeaders(req);
    this.logger.log(`[register] POST ${url}`);
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(url, registerDto, { headers }),
      );
      return data;
    } catch (error) {
      this.handleAxiosError(error, url);
    }
  }

  private handleAxiosError(error: any, url: string): never {
    const axiosError = error as AxiosError;
    this.logger.error(
      `[AuthService] ${url} 호출 중 오류: ${axiosError.message}`,
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
