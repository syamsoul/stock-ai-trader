import { Injectable } from '@nestjs/common';
import { BrokerOrderRequest, BrokerOrderResult } from '../common/trading.types';
import { AppConfigService } from '../config/app-config.service';
import { AlpacaBrokerAdapter, BrokerPosition } from './alpaca-broker.adapter';
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

  async getAccount() {
    this.assertAlpacaBroker('account');
    return this.alpacaBroker.getAccount();
  }

  async listOrders() {
    this.assertAlpacaBroker('orders');
    return this.alpacaBroker.listOrders();
  }

  async listPositions(): Promise<BrokerPosition[]> {
    this.assertAlpacaBroker('positions');
    return this.alpacaBroker.listPositions();
  }

  async closePosition(position: BrokerPosition, reason: string): Promise<BrokerOrderResult> {
    this.assertAlpacaBroker('close positions');
    return this.alpacaBroker.closePosition(position, reason);
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

  private assertAlpacaBroker(action: string) {
    if (this.config.brokerProvider !== 'alpaca') {
      throw new Error(`Broker ${action} endpoint is currently implemented for Alpaca only.`);
    }
  }
}
