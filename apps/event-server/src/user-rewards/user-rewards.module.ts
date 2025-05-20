import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserRewardsController } from './user-rewards.controller';
import { UserRewardsService } from './user-rewards.service';
import {
  UserRewardEntry,
  UserRewardEntrySchema,
} from './schemas/user-reward-entry.schema';
import { EventsModule } from '../events/events.module';
import { Event, EventSchema } from '../events/schemas/event.schema';
import { Reward, RewardSchema } from '../rewards/schemas/reward.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserRewardEntry.name, schema: UserRewardEntrySchema },
      { name: Event.name, schema: EventSchema },
      { name: Reward.name, schema: RewardSchema },
    ]),
    EventsModule,
  ],
  controllers: [UserRewardsController],
  providers: [UserRewardsService],
  exports: [UserRewardsService],
})
export class UserRewardsModule {}
