import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('EVENT_SERVER_PORT') || 3002;

  app.setGlobalPrefix('api/v1'); // API 전역 접두사 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 정의되지 않은 속성 자동 제거
      forbidNonWhitelisted: true, // DTO에 정의되지 않은 속성이 있으면 요청 거부
      transform: true, // 요청 데이터를 DTO 타입으로 자동 변환
      transformOptions: {
        enableImplicitConversion: true, // 암시적 타입 변환 활성화 (문자열을 숫자/불리언 등으로)
      },
    }),
  );

  // Swagger 설정
  const swaggerConfig = new DocumentBuilder()
    .setTitle('이벤트 서버 API')
    .setDescription(
      'Nexon 이벤트 관리 플랫폼을 위한 이벤트 서버 API 문서입니다.',
    )
    .addTag('이벤트', '이벤트 관리 관련 API')
    .addTag('보상', '보상 관리 관련 API')
    .addTag('사용자 보상', '사용자 보상 관리 관련 API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  Logger.log(
    `✅ 이벤트 서버가 다음 주소에서 실행 중입니다: http://localhost:${port}/api/v1`,
    'Bootstrap',
  );
  Logger.log(
    `✅ 이벤트 서버 Swagger UI는 다음 주소에서 확인 가능합니다: http://localhost:${port}/api-docs`,
    'Bootstrap',
  );
}
bootstrap();
