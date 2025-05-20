import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('헬스 체크')
@Controller()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private configService: ConfigService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @Public() // 헬스 체크는 일반적으로 인증 없이 접근 가능
  @ApiBearerAuth('JWT-auth')
  @HealthCheck()
  @ApiOperation({
    summary: '시스템 전체 상태 확인',
    description:
      '게이트웨이 서버 및 연결된 주요 서비스(인증, 이벤트)의 상태를 확인합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '모든 서비스가 정상적으로 응답하는 경우 (healthy).',
  })
  @ApiResponse({
    status: 503,
    description: '하나 이상의 서비스에 문제가 있는 경우 (unhealthy).',
  })
  async check() {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVER_URL');
    const eventServiceUrl = this.configService.get<string>('EVENT_SERVER_URL');

    // AUTH_SERVER_URL과 EVENT_SERVER_URL에서 /api/v1 부분을 제거하거나,
    // 각 서비스의 실제 헬스체크 엔드포인트로 변경해야 합니다.
    // 여기서는 각 서비스의 루트 URL로 가정하고 호출합니다.
    // 예: http://localhost:3001 (AUTH_SERVER_URL이 http://localhost:3001/api/v1 일 경우)

    const authServiceHealthUrl = authServiceUrl
      ? authServiceUrl.replace(/\/api\/v1\/?$/, '')
      : authServiceUrl;
    const eventServiceHealthUrl =
      eventServiceUrl?.replace('/api/v1', '') || eventServiceUrl;

    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024), // 150MB 힙 메모리 제한
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024), // 300MB RSS 메모리 제한
      // 디스크 공간 확인 (루트 경로에 대해 50% 사용량 초과 시 경고)
      // process.cwd()는 현재 작업 디렉토리를 반환합니다. 시스템에 따라 적절한 경로로 수정 필요.
      () =>
        this.disk.checkStorage('disk_health', {
          thresholdPercent: 0.5, // 디스크 사용량 50% 초과 시 unhealthy
          path: '/', // 루트 디렉토리 검사. Windows의 경우 'C:\' 등
        }),
      // Auth Service 상태 확인 (URL이 정의된 경우에만)
      ...(authServiceHealthUrl
        ? [
            () =>
              this.http.pingCheck('auth-service', authServiceHealthUrl, {
                timeout: 2000,
              }),
          ]
        : []),
      // Event Service 상태 확인 (URL이 정의된 경우에만)
      ...(eventServiceHealthUrl
        ? [
            () =>
              this.http.pingCheck('event-service', eventServiceHealthUrl, {
                timeout: 2000,
              }),
          ]
        : []),
    ]);
  }
}
