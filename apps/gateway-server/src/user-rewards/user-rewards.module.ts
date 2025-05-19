import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { UserRewardsController } from './user-rewards.controller';
import { UserRewardsService } from './user-rewards.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [UserRewardsController],
  providers: [UserRewardsService],
})
export class UserRewardsModule {}
