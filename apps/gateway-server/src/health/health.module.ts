import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TerminusModule,
    HttpModule, // HttpHealthIndicator에서 사용
    ConfigModule, // AUTH_SERVER_URL, EVENT_SERVER_URL 환경 변수 접근
  ],
  controllers: [HealthController],
})
export class HealthModule {}
