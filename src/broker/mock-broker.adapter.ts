import { Injectable } from '@nestjs/common';
import { BrokerOrderRequest, BrokerOrderResult } from '../common/trading.types';

@Injectable()
export class MockBrokerAdapter {
  async placePaperOrder(
    request: BrokerOrderRequest,
  ): Promise<BrokerOrderResult> {
    return {
      brokerOrderId: `mock_${request.market}_${request.symbol}_${Date.now()}`,
      status: 'SUBMITTED',
    };
  }
}
