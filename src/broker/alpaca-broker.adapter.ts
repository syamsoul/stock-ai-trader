import { Injectable } from '@nestjs/common';
import { BrokerOrderRequest, BrokerOrderResult } from '../common/trading.types';
import { AppConfigService } from '../config/app-config.service';

type AlpacaOrderResponse = {
  id?: string;
  status?: string;
  message?: string;
  code?: number;
};

@Injectable()
export class AlpacaBrokerAdapter {
  constructor(private readonly config: AppConfigService) {}

  async placeOrder(request: BrokerOrderRequest): Promise<BrokerOrderResult> {
    if (request.market !== 'US') {
      return {
        brokerOrderId: `alpaca_rejected_${Date.now()}`,
        status: 'REJECTED',
        message: 'Alpaca adapter only supports US market orders.',
      };
    }

    if (!request.limitPrice) {
      return {
        brokerOrderId: `alpaca_rejected_${Date.now()}`,
        status: 'REJECTED',
        message: 'Alpaca adapter requires a limit price for this app flow.',
      };
    }

    const response = await fetch(`${this.config.alpacaBaseUrl}/v2/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'APCA-API-KEY-ID': this.config.alpacaApiKeyId,
        'APCA-API-SECRET-KEY': this.config.alpacaSecretKey,
      },
      body: JSON.stringify({
        symbol: this.orderCode(request.symbol),
        qty: String(request.quantity),
        side: request.side.toLowerCase(),
        type: 'limit',
        time_in_force: 'day',
        limit_price: String(request.limitPrice),
        client_order_id: this.clientOrderId(request),
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as AlpacaOrderResponse;

    if (!response.ok) {
      return {
        brokerOrderId: `alpaca_rejected_${Date.now()}`,
        status: 'REJECTED',
        message: payload.message ?? `Alpaca order rejected with HTTP ${response.status}.`,
      };
    }

    return {
      brokerOrderId: payload.id ?? `alpaca_${Date.now()}`,
      status: 'SUBMITTED',
      message: `Alpaca ${this.config.brokerEnv} order status: ${payload.status ?? 'unknown'}.`,
    };
  }

  private orderCode(symbol: string): string {
    return symbol.includes('.') ? symbol.split('.').at(-1) ?? symbol : symbol;
  }

  private clientOrderId(request: BrokerOrderRequest): string {
    const symbol = this.orderCode(request.symbol).replace(/[^a-zA-Z0-9_-]/g, '');
    return `stock-ai-trader-${symbol}-${Date.now()}`.slice(0, 48);
  }
}
