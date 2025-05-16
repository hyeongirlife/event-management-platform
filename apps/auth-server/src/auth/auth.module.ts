import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    UsersModule, // UsersService를 사용하기 위해 import
    PassportModule.register({ defaultStrategy: 'jwt' }), // 기본 Passport 전략 설정
    JwtModule.registerAsync({
      imports: [ConfigModule], // ConfigModule을 사용하여 환경 변수 접근
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // .env 파일에서 JWT 시크릿 키 가져오기
        signOptions: {
          expiresIn: configService.get<string | number>('JWT_EXPIRES_IN'), // .env 파일에서 만료 시간 가져오기
        },
      }),
    }),
    ConfigModule, // ConfigService를 사용하기 위해 import (이미 app.module.ts에 global로 있다면 생략 가능)
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy], // JwtStrategy를 providers에 추가
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
