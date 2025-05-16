import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './users.service'; // 주석 해제
// import { UsersController } from './users.controller'; // 나중에 생성 및 주석 해제 (필요하다면)

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  // controllers: [UsersController], // 나중에 UsersController를 만들면 주석 해제
  providers: [UsersService], // UsersService 추가
  exports: [UsersService], // UsersService 추가 (AuthModule 등 다른 모듈에서 사용하기 위함)
})
export class UsersModule {}
