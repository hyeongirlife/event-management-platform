import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 사용자 이름과 비밀번호를 검증합니다.
   * @param username 사용자 이름
   * @param pass 입력된 비밀번호
   * @returns 비밀번호가 일치하면 사용자 객체 (비밀번호 제외), 그렇지 않으면 null
   */
  async validateUser(
    username: string,
    pass: string,
  ): Promise<Omit<UserDocument, 'password'> | null> {
    const user = await this.usersService.findUserByUsername(username);
    if (user && (await user.comparePassword(pass))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user.toObject(); // 비밀번호 제외
      return result as Omit<UserDocument, 'password'>;
    }
    return null;
  }

  /**
   * 로그인 성공 후 JWT를 생성하여 반환합니다.
   * @param user 사용자 객체 (UserDocument 또는 Omit<UserDocument, 'password'>)
   * @returns 액세스 토큰 객체 { access_token: string }
   */
  async login(
    user:
      | Omit<UserDocument, 'password'>
      | Pick<UserDocument, '_id' | 'username' | 'roles'>,
  ) {
    const payload = {
      username: user.username,
      sub: user._id, // JWT의 subject로 사용자 ID 사용
      roles: user.roles, // JWT payload에 역할 정보 포함
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * 새로운 사용자를 등록합니다.
   * UsersService의 createUser를 호출하며, 예외 처리를 포함할 수 있습니다.
   * @param createUserDto 사용자 생성 DTO
   * @returns 생성된 사용자 객체 (비밀번호 제외)
   */
  async register(
    createUserDto: CreateUserDto,
  ): Promise<Omit<UserDocument, 'password'>> {
    try {
      // UsersService의 createUser는 이미 username/email 중복 검사를 수행함
      const user = await this.usersService.createUser(createUserDto);
      // createUserDto가 User 스키마와 정확히 일치하고, toObject()로 password가 제거된 객체를 반환한다고 가정
      return user as Omit<UserDocument, 'password'>;
    } catch (error) {
      // UsersService에서 ConflictException 등이 발생할 수 있음
      // 여기서 추가적인 로깅이나 에러 변환을 할 수 있지만, 일단 그대로 re-throw
      throw error;
    }
  }
}
