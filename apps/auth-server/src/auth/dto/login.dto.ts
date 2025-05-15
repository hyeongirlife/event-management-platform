import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: '로그인 시 사용할 사용자 이름',
    example: 'test',
    required: true,
  })
  @IsString({ message: '사용자 이름은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '사용자 이름은 비워둘 수 없습니다.' })
  username: string;

  @ApiProperty({
    description: '로그인 시 사용할 비밀번호 (최소 8자 이상)',
    example: 'test123!',
    required: true,
    minLength: 8,
  })
  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '비밀번호는 비워둘 수 없습니다.' })
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  password: string;
}
