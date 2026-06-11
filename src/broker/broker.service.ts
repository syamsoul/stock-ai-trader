import { Injectable } from '@nestjs/common';
import { BrokerOrderRequest, BrokerOrderResult } from '../common/trading.types';
import { AppConfigService } from '../config/app-config.service';
import { AlpacaBrokerAdapter } from './alpaca-broker.adapter';
import { MoomooBrokerAdapter } from './moomoo-broker.adapter';
import { MockBrokerAdapter } from './mock-broker.adapter';

@Injectable()
export class BrokerService {
  constructor(
    private readonly config: AppConfigService,
    private readonly mockBroker: MockBrokerAdapter,
    private readonly moomooBroker: MoomooBrokerAdapter,
    private readonly alpacaBroker: AlpacaBrokerAdapter,
  ) {}

  async listMoomooAccounts() {
    return this.moomooBroker.listAccounts();
  }

  async placePaperOrder(request: BrokerOrderRequest): Promise<BrokerOrderResult> {
    if (this.config.brokerProvider === 'mock') {
      return this.mockBroker.placePaperOrder(request);
    }

    if (this.config.brokerProvider === 'alpaca') {
      return this.alpacaBroker.placeOrder(request);
    }

    return this.moomooBroker.placeOrder(request);
  }
}
