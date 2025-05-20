import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const appUrl = `http://localhost:${port}`; // Swagger UI에서 사용할 기본 URL

  app.setGlobalPrefix('api/v1');

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('게이트웨이 API')
    .setDescription(
      '이벤트 플랫폼 API 게이트웨이입니다. 인증을 처리하고 요청을 다운스트림 서비스로 프록시합니다.',
    )
    .setVersion('1.0')
    .addTag('게이트웨이', '일반 게이트웨이 작업 및 프록시')
    .addTag('인증', '인증 서비스로 프록시되는 인증 및 인가 관련 엔드포인트')
    .addTag('이벤트', '이벤트 서비스로 프록시되는 이벤트 관련 엔드포인트')
    .addServer(`${appUrl}`, '로컬 개발 서버')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'JWT 토큰을 입력하세요',
        in: 'header',
      },
      'JWT-auth', // 이 이름은 @ApiBearerAuth() 데코레이터와 일치해야 합니다.
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 새로고침 시에도 Authorization 유지
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

  await app.listen(port);
  console.log(
    `✅ 게이트웨이 서버가 다음 주소에서 실행 중입니다: ${await app.getUrl()}`,
  );
  console.log(
    `✅ 게이트웨이 서버 Swagger UI는 다음 주소에서 확인 가능합니다: ${await app.getUrl()}/api-docs`,
  );
}
bootstrap();
