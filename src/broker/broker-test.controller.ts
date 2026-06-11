import { Body, Controller, Get, Post } from '@nestjs/common';
import { BrokerOrderRequest, MarketCode } from '../common/trading.types';
import { BrokerService } from './broker.service';

type TestPaperOrderBody = {
  market?: MarketCode;
  symbol?: string;
  side?: 'BUY' | 'SELL';
  quantity?: number;
  limitPrice?: number;
};

@Controller('broker')
export class BrokerTestController {
  constructor(private readonly brokerService: BrokerService) {}

  @Get('moomoo/accounts')
  async listMoomooAccounts() {
    return this.brokerService.listMoomooAccounts();
  }

  @Post('paper-order/test')
  async placeTestPaperOrder(@Body() body: TestPaperOrderBody) {
    const request: BrokerOrderRequest = {
      market: body.market ?? 'US',
      symbol: body.symbol ?? 'AAPL',
      side: body.side ?? 'BUY',
      quantity: body.quantity ?? 1,
      orderType: 'LIMIT',
      limitPrice: body.limitPrice ?? 1,
      rationale: 'Manual localhost paper-order test.',
    };

    return this.brokerService.placePaperOrder(request);
  }
}
