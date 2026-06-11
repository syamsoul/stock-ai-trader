import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AiDecisionModule } from './ai-decision/ai-decision.module';
import { AuditModule } from './audit/audit.module';
import { BrokerModule } from './broker/broker.module';
import { AppConfigModule } from './config/app-config.module';
import { MarketModule } from './market/market.module';
import { PrismaModule } from './prisma/prisma.module';
import { RiskModule } from './risk/risk.module';
import { TradingSchedulerModule } from './trading-scheduler/trading-scheduler.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    ScheduleModule.forRoot(),
    MarketModule,
    AiDecisionModule,
    RiskModule,
    BrokerModule,
    AuditModule,
    TradingSchedulerModule,
  ],
})
export class AppModule {}
