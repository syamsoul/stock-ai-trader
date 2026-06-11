import { Module } from '@nestjs/common';
import { AiDecisionModule } from '../ai-decision/ai-decision.module';
import { AuditModule } from '../audit/audit.module';
import { BrokerModule } from '../broker/broker.module';
import { MarketModule } from '../market/market.module';
import { RiskModule } from '../risk/risk.module';
import { TradingController } from './trading.controller';
import { TradingEngineService } from './trading-engine.service';
import { TradingSchedulerService } from './trading-scheduler.service';

@Module({
  imports: [MarketModule, AiDecisionModule, RiskModule, BrokerModule, AuditModule],
  controllers: [TradingController],
  providers: [TradingEngineService, TradingSchedulerService],
  exports: [TradingEngineService],
})
export class TradingSchedulerModule {}
