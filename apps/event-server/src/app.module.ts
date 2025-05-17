import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsModule } from './events/events.module';
import { RewardsModule } from './rewards/rewards.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 다른 모듈에서 ConfigService를 사용하기 위해 global로 설정
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : '.env.development',
      // envFilePath를 통해 환경별 .env 파일 로드 (선택 사항, 필요에 따라 단순 '.env' 사용 가능)
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule], // MongooseModule에서 ConfigService를 사용하기 위해 ConfigModule 임포트
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('EVENT_MONGODB_URI'),
        dbName: configService.get<string>('EVENT_MONGODB_DB_NAME'),
        // 추가적인 Mongoose 옵션이 필요하면 여기에 추가
        // useNewUrlParser: true, // 최신 버전 Mongoose에서는 기본값으로 사용될 수 있음
        // useUnifiedTopology: true, // 최신 버전 Mongoose에서는 기본값으로 사용될 수 있음
      }),
      inject: [ConfigService], // ConfigService 주입
    }),
    EventsModule,
    RewardsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
