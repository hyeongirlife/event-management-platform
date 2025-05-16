import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  const config = new DocumentBuilder()
    .setTitle('인증 서버 API')
    .setDescription('Nexon 이벤트 관리 플랫폼을 위한 인증 서버 API 문서입니다.')
    .setVersion('1.0')
    .addTag('auth', '사용자 인증 및 인가 관련 엔드포인트')
    .addTag('users', '사용자 관리 엔드포인트 (주로 내부 또는 관리자용)')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(
    `✅ 인증 서버가 다음 주소에서 실행 중입니다: ${await app.getUrl()}`,
  );
}
bootstrap();
