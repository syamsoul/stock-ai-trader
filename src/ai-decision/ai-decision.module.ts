import { Module } from '@nestjs/common';
import { AiDecisionService } from './ai-decision.service';

@Module({
  providers: [AiDecisionService],
  exports: [AiDecisionService],
})
export class AiDecisionModule {}
