import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UserDocument } from '../../users/schemas/user.schema';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'username', // 요청에서 username 필드 이름 (기본값)
      // passwordField: 'password' // 요청에서 password 필드 이름 (기본값)
    });
  }

  /**
   * Passport-local 전략의 핵심 검증 로직입니다.
   * HTTP 요청에서 추출된 username과 password를 사용하여 사용자를 검증합니다.
   * @param username 요청에서 추출된 사용자 이름
   * @param password 요청에서 추출된 비밀번호
   * @returns 검증 성공 시 사용자 객체 (비밀번호 제외), 실패 시 UnauthorizedException 발생
   */
  async validate(
    username: string,
    password_from_request: string, // password와 겹치지 않도록 파라미터 이름 변경
  ): Promise<Omit<UserDocument, 'password'>> {
    // console.log(`LocalStrategy: validate - username: ${username}`);
    const user = await this.authService.validateUser(
      username,
      password_from_request,
    );
    if (!user) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 잘못되었습니다.');
    }
    return user; // 이 user 객체가 req.user에 담기게 됩니다.
  }
}
