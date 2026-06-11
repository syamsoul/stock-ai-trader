import { Injectable, Logger } from '@nestjs/common';
import MoomooWebSocket from 'moomoo-api';
import { Trd_Common } from 'moomoo-api/proto';
import { BrokerOrderRequest, BrokerOrderResult, MarketCode } from '../common/trading.types';
import { AppConfigService } from '../config/app-config.service';

type MoomooResponse = {
  retType?: number;
  retMsg?: string;
  errCode?: number;
  s2c?: {
    accList?: MoomooAccount[];
    orderID?: string | number;
    orderIDEx?: string;
  };
};

type MoomooAccount = {
  accID?: string | number;
  trdEnv?: number;
  trdMarketAuthList?: number[];
};

type MoomooEnums = {
  TrdEnv: Record<string, number>;
  TrdSide: Record<string, number>;
  OrderType: Record<string, number>;
  TrdMarket: Record<string, number>;
  TrdSecMarket: Record<string, number>;
};

@Injectable()
export class MoomooBrokerAdapter {
  private readonly logger = new Logger(MoomooBrokerAdapter.name);
  private tradeSerialNo = 1;

  constructor(private readonly config: AppConfigService) {}

  async listAccounts(): Promise<MoomooAccount[]> {
    const websocket = new MoomooWebSocket();

    try {
      await this.connect(websocket);
      const response = await websocket.GetAccList({
        c2s: {
          userID: 0,
        },
      }) as MoomooResponse;

      return response.s2c?.accList ?? [];
    } finally {
      websocket.stop();
    }
  }

  async placeOrder(request: BrokerOrderRequest): Promise<BrokerOrderResult> {
    const enums = Trd_Common as unknown as MoomooEnums;
    const websocket = new MoomooWebSocket();

    try {
      await this.connect(websocket);
      const account = await this.resolveAccount(websocket, request.market, enums);
      const orderResponse = await websocket.PlaceOrder(
        this.buildPlaceOrderRequest(websocket, account, request, enums),
      ) as MoomooResponse;

      const orderId =
        orderResponse.s2c?.orderIDEx ??
        (orderResponse.s2c?.orderID == null ? undefined : String(orderResponse.s2c.orderID));

      return {
        brokerOrderId: orderId ?? `moomoo_${Date.now()}`,
        status: 'SUBMITTED',
        message: `Moomoo ${this.config.brokerEnv} order accepted by OpenD.`,
      };
    } catch (error) {
      const message = this.formatError(error);
      this.logger.error(`Moomoo paper order failed: ${message}`);

      return {
        brokerOrderId: `moomoo_rejected_${Date.now()}`,
        status: 'REJECTED',
        message,
      };
    } finally {
      websocket.stop();
    }
  }

  private connect(websocket: MoomooWebSocket): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Timed out connecting to Moomoo OpenD.'));
      }, 10_000);

      websocket.onlogin = (ret?: unknown, msg?: unknown) => {
        clearTimeout(timer);
        if (ret === false) {
          reject(new Error(`Moomoo OpenD login failed: ${String(msg)}`));
          return;
        }
        resolve();
      };

      websocket.start(
        this.config.moomooOpenDHost,
        this.config.moomooOpenDPort,
        this.config.moomooOpenDSsl,
        this.config.moomooOpenDKey || undefined,
      );
    });
  }

  private async resolveAccount(
    websocket: MoomooWebSocket,
    market: MarketCode,
    enums: MoomooEnums,
  ): Promise<MoomooAccount> {
    const response = await websocket.GetAccList({
      c2s: {
        userID: 0,
      },
    }) as MoomooResponse;

    const configuredAccountId = this.configuredAccountId(market);
    const expectedEnv = this.config.brokerEnv === 'REAL'
      ? enums.TrdEnv.TrdEnv_Real
      : enums.TrdEnv.TrdEnv_Simulate;
    const expectedMarket = this.trdMarket(market, enums);
    const accounts = response.s2c?.accList ?? [];

    const account = accounts.find((candidate) => {
      const accountIdMatches = configuredAccountId
        ? String(candidate.accID) === configuredAccountId
        : true;
      const envMatches = candidate.trdEnv === expectedEnv;
      const marketMatches = candidate.trdMarketAuthList?.includes(expectedMarket) ?? false;

      return accountIdMatches && envMatches && marketMatches;
    });

    if (!account?.accID) {
      throw new Error(
        `No Moomoo ${this.config.brokerEnv} account found for ${market}. Check account ID and paper-trading market permissions.`,
      );
    }

    return account;
  }

  private buildPlaceOrderRequest(
    websocket: MoomooWebSocket,
    account: MoomooAccount,
    request: BrokerOrderRequest,
    enums: MoomooEnums,
  ) {
    return {
      c2s: {
        packetID: {
          connID: websocket.getConnID(),
          serialNo: this.tradeSerialNo++,
        },
        header: {
          trdEnv: account.trdEnv,
          accID: account.accID,
          trdMarket: this.trdMarket(request.market, enums),
        },
        trdSide: request.side === 'BUY'
          ? enums.TrdSide.TrdSide_Buy
          : enums.TrdSide.TrdSide_Sell,
        orderType: enums.OrderType.OrderType_Normal,
        code: this.orderCode(request.symbol),
        qty: request.quantity,
        price: request.limitPrice ?? undefined,
        secMarket: this.trdSecMarket(request.market, enums),
        remark: 'stock-ai-trader-paper-test',
      },
    };
  }

  private configuredAccountId(market: MarketCode): string {
    return market === 'MY'
      ? this.config.moomooAccountIdMy
      : this.config.moomooAccountIdUs;
  }

  private trdMarket(market: MarketCode, enums: MoomooEnums): number {
    return market === 'MY'
      ? enums.TrdMarket.TrdMarket_MY
      : enums.TrdMarket.TrdMarket_US;
  }

  private trdSecMarket(market: MarketCode, enums: MoomooEnums): number {
    return market === 'MY'
      ? enums.TrdSecMarket.TrdSecMarket_MY
      : enums.TrdSecMarket.TrdSecMarket_US;
  }

  private orderCode(symbol: string): string {
    return symbol.includes('.') ? symbol.split('.').at(-1) ?? symbol : symbol;
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'object' && error !== null) {
      const response = error as MoomooResponse;
      if (response.retMsg || response.errCode != null || response.retType != null) {
        return `OpenD retType=${response.retType ?? 'unknown'} errCode=${response.errCode ?? 'unknown'} retMsg=${response.retMsg ?? ''}`;
      }
    }

    return String(error);
  }
}
