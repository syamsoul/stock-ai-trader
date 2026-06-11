import { Injectable } from '@nestjs/common';
import { BrokerOrderRequest, BrokerOrderResult } from '../common/trading.types';
import { AppConfigService } from '../config/app-config.service';

type AlpacaOrderResponse = {
  id?: string;
  status?: string;
  symbol?: string;
  side?: string;
  qty?: string;
  limit_price?: string;
  filled_avg_price?: string;
  submitted_at?: string;
  message?: string;
  code?: number;
};

type AlpacaPositionResponse = {
  symbol: string;
  qty: string;
  side: 'long' | 'short';
  market_value: string;
  cost_basis: string;
  avg_entry_price: string;
  current_price: string;
  unrealized_pl: string;
  unrealized_plpc: string;
};

type AlpacaAccountResponse = {
  id?: string;
  status?: string;
  currency?: string;
  buying_power?: string;
  cash?: string;
  portfolio_value?: string;
  equity?: string;
  last_equity?: string;
};

export type BrokerPosition = {
  symbol: string;
  quantity: number;
  side: 'long' | 'short';
  marketValue: number;
  costBasis: number;
  averageEntryPrice: number;
  currentPrice: number;
  unrealizedProfitLoss: number;
  unrealizedProfitLossPercent: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  exitSignal: 'TAKE_PROFIT' | 'STOP_LOSS' | 'HOLD';
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

    const payload = await this.request<AlpacaOrderResponse>('/v2/orders', {
      method: 'POST',
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

    return {
      brokerOrderId: payload.id ?? `alpaca_${Date.now()}`,
      status: 'SUBMITTED',
      message: `Alpaca ${this.config.brokerEnv} order status: ${payload.status ?? 'unknown'}.`,
    };
  }

  async getAccount() {
    return this.request<AlpacaAccountResponse>('/v2/account');
  }

  async listOrders() {
    return this.request<AlpacaOrderResponse[]>('/v2/orders?status=all&limit=20&direction=desc');
  }

  async listPositions(): Promise<BrokerPosition[]> {
    const positions = await this.request<AlpacaPositionResponse[]>('/v2/positions');

    return positions.map((position) => this.mapPosition(position));
  }

  async closePosition(position: BrokerPosition, reason: string): Promise<BrokerOrderResult> {
    const side = position.side === 'long' ? 'SELL' : 'BUY';

    return this.placeOrder({
      symbol: `US.${position.symbol}`,
      market: 'US',
      side,
      quantity: Math.abs(position.quantity),
      orderType: 'LIMIT',
      limitPrice: position.currentPrice,
      rationale: reason,
    });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.config.alpacaBaseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'APCA-API-KEY-ID': this.config.alpacaApiKeyId,
        'APCA-API-SECRET-KEY': this.config.alpacaSecretKey,
        ...init.headers,
      },
    });

    const payload = (await response.json().catch(() => ({}))) as T & {
      message?: string;
    };

    if (!response.ok) {
      throw new Error(payload.message ?? `Alpaca request failed with HTTP ${response.status}.`);
    }

    return payload;
  }

  private mapPosition(position: AlpacaPositionResponse): BrokerPosition {
    const averageEntryPrice = Number(position.avg_entry_price);
    const currentPrice = Number(position.current_price);
    const quantity = Number(position.qty);
    const takeProfitPrice = averageEntryPrice * (1 + this.config.defaultTakeProfitPercent / 100);
    const stopLossPrice = averageEntryPrice * (1 - this.config.defaultStopLossPercent / 100);
    let exitSignal: BrokerPosition['exitSignal'] = 'HOLD';

    if (position.side === 'long' && currentPrice >= takeProfitPrice) {
      exitSignal = 'TAKE_PROFIT';
    }

    if (position.side === 'long' && currentPrice <= stopLossPrice) {
      exitSignal = 'STOP_LOSS';
    }

    return {
      symbol: position.symbol,
      quantity,
      side: position.side,
      marketValue: Number(position.market_value),
      costBasis: Number(position.cost_basis),
      averageEntryPrice,
      currentPrice,
      unrealizedProfitLoss: Number(position.unrealized_pl),
      unrealizedProfitLossPercent: Number(position.unrealized_plpc) * 100,
      takeProfitPrice,
      stopLossPrice,
      exitSignal,
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
