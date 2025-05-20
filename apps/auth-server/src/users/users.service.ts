import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Connection, Model, ClientSession } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto'; // DTO (나중에 생성 필요)
// import { UpdateUserDto } from './dto/update-user.dto'; // DTO (나중에 생성 필요)

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  /**
   * 새로운 사용자를 생성합니다.
   * username 또는 email이 이미 존재하면 ConflictException을 발생시킵니다.
   * @param createUserDto 사용자 생성 DTO
   * @param session 몽고DB 세션
   * @returns 생성된 사용자 객체 (비밀번호 제외)
   */
  async createUser(
    createUserDto: CreateUserDto,
    session?: ClientSession,
  ): Promise<Omit<User, 'password'>> {
    const { username, email } = createUserDto;

    // username 또는 email 중복 확인
    const existingUser = await this.userModel
      .findOne({ $or: [{ username }, { email }] })
      .session(session || null)
      .exec();
    if (existingUser) {
      if (existingUser.username === username) {
        throw new ConflictException(`Username '${username}' already exists.`);
      }
      if (existingUser.email === email) {
        throw new ConflictException(`Email '${email}' already exists.`);
      }
    }

    const newUser = new this.userModel(createUserDto);
    // save() 메서드 내에서 pre-save hook이 실행되어 비밀번호가 해싱됨
    const savedUser = await newUser.save({ session });

    // mongoose 문서를 일반 객체로 변환하고 password 필드를 수동으로 한 번 더 확실히 제거
    // UserSchema의 toJSON transform이 호출되지만, 명시적으로 타입을 맞추기 위함
    const userObject = savedUser.toObject() as Omit<User, 'password'>;
    return userObject;
  }

  /**
   * 모든 사용자를 조회합니다. (실제 프로덕션에서는 페이지네이션 등 필요)
   * @returns 사용자 목록 (비밀번호 제외)
   */
  async findAllUsers(): Promise<Omit<User, 'password'>[]> {
    return this.userModel.find().exec(); // toJSON transform에 의해 password 제외됨
  }

  /**
   * ID로 특정 사용자를 조회합니다.
   * @param id 사용자 ID
   * @returns 사용자 객체 (비밀번호 제외) 또는 NotFoundException
   */
  async findUserById(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found.`);
    }
    return user; // toJSON transform에 의해 password 제외됨
  }

  /**
   * Username으로 특정 사용자를 조회합니다. (로그인 시 사용)
   * 비밀번호를 포함하여 반환합니다.
   * @param username 사용자 이름
   * @returns 사용자 객체 (비밀번호 포함) 또는 null
   */
  async findUserByUsername(username: string): Promise<UserDocument | null> {
    // password 필드를 명시적으로 select 해야 pre-save hook에서 제외되지 않음
    // 또는 스키마에서 select: false로 password를 설정했다면 여기서 +password 해줘야 함.
    // 현재 스키마에서는 password를 제외하지 않았으므로 기본적으로 포함됨.
    const user = await this.userModel.findOne({ username }).exec();
    return user;
  }

  /**
   * Email로 특정 사용자를 조회합니다.
   * @param email 사용자 이메일
   * @returns 사용자 객체 (비밀번호 제외) 또는 null
   */
  async findUserByEmail(email: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.userModel.findOne({ email }).exec();
    return user; // toJSON transform에 의해 password 제외됨
  }

  // TODO: Update user (UpdateUserDto 필요)
  // async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> { ... }

  // TODO: Delete user
  // async deleteUser(id: string): Promise<void> { ... }
}
