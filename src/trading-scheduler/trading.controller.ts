import { Controller, Post } from '@nestjs/common';
import { TradingEngineService } from './trading-engine.service';

@Controller('trading')
export class TradingController {
  constructor(private readonly tradingEngine: TradingEngineService) {}

  @Post('run')
  async runNow() {
    await this.tradingEngine.runScheduledAnalysis();
    return { status: 'COMPLETED' };
  }
}
