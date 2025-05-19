import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
