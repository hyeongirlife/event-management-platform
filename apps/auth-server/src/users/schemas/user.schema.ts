import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, SchemaTypes } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../enums/user-role.enum'; // 역할 Enum (나중에 생성 필요)

// Interface for custom methods on the User document
interface UserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export type UserDocument = HydratedDocument<User> & UserMethods;

const SALT_ROUNDS = 10; // bcrypt salt rounds

@Schema({
  timestamps: true, // createdAt, updatedAt 자동 생성
  toJSON: {
    // JSON으로 변환 시 password 필드 제외
    transform: (doc, ret) => {
      delete ret.password;
      return ret;
    },
  },
  toObject: {
    // 객체로 변환 시 password 필드 제외
    transform: (doc, ret) => {
      delete ret.password;
      return ret;
    },
  },
})
export class User extends Document {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id: string; // Mongoose가 자동으로 생성하는 ID

  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true, // username은 소문자로 통일 (선택 사항)
    index: true,
  })
  username: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'is invalid'], // 간단한 이메일 형식 검증
    index: true,
  })
  email: string;

  @Prop({
    type: String,
    required: true,
    minlength: 8, // 비밀번호 최소 길이 (선택 사항)
  })
  password: string;

  @Prop({
    type: [String], // 문자열 배열로 역할 저장
    enum: UserRole, // UserRole Enum 값만 허용
    default: [UserRole.USER], // 기본 역할은 USER
  })
  roles: UserRole[];

  // createdAt, updatedAt은 timestamps: true 옵션으로 자동 생성됨
}

export const UserSchema = SchemaFactory.createForClass(User);

// 비밀번호 해싱을 위한 pre-save hook
UserSchema.pre<UserDocument>('save', async function (next) {
  // isModified('password')는 password 필드가 변경되었을 때만 true
  // isNew는 새로운 문서일 때 true
  if (!this.isModified('password') && !this.isNew) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err as Error);
  }
});

// (선택 사항) 비밀번호 비교 메서드 추가
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};
