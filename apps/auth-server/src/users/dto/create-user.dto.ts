import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({
    description: '사용자 이름 (로그인 시 사용)',
    example: 'testuser1',
    required: true,
  })
  @IsNotEmpty({ message: 'Username은 필수 입력 항목입니다.' })
  @IsString()
  username: string;

  @ApiProperty({
    description: '사용자 이메일 주소',
    example: 'user@example.com',
    required: true,
  })
  @IsNotEmpty({ message: 'Email은 필수 입력 항목입니다.' })
  @IsEmail({}, { message: '유효한 이메일 형식이 아닙니다.' })
  email: string;

  @ApiProperty({
    description: '사용자 비밀번호 (최소 8자 이상)',
    example: 'password123!',
    required: true,
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Password는 필수 입력 항목입니다.' })
  @IsString()
  @MinLength(8, { message: 'Password는 최소 8자 이상이어야 합니다.' })
  password: string;

  @ApiProperty({
    description: '사용자 역할 (선택 사항, 기본값: USER)',
    example: [UserRole.USER, UserRole.OPERATOR],
    required: false,
    isArray: true,
    enum: UserRole,
    enumName: 'UserRole',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true, message: '유효하지 않은 역할입니다.' })
  roles?: UserRole[];
}
