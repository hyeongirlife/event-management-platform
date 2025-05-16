import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    ConfigModule, // JwtStrategy에서 ConfigService를 사용하기 위해 import
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule], // ConfigModule을 import하여 ConfigService 사용
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        // signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') }, // Gateway에서는 토큰 서명은 하지 않으므로 expiresIn은 불필요
      }),
      inject: [ConfigService], // ConfigService 주입
    }),
  ],
  providers: [JwtStrategy, JwtAuthGuard, RolesGuard], // Guard들을 providers에 추가
  exports: [PassportModule, JwtModule, JwtAuthGuard, RolesGuard], // Guard들을 exports에 추가
})
export class AuthModule {}
