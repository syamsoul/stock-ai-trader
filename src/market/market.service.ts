import { Injectable, Logger } from '@nestjs/common';
import { MarketSnapshot } from '../common/trading.types';
import { AppConfigService } from '../config/app-config.service';

type AlpacaLatestBarsResponse = {
  bars?: Record<
    string,
    {
      o?: number;
      c?: number;
      v?: number;
      t?: string;
    }
  >;
};

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  constructor(private readonly config: AppConfigService) {}

  async getWatchlistSnapshots(): Promise<MarketSnapshot[]> {
    if (this.config.marketDataProvider === 'alpaca') {
      const snapshots = await this.getAlpacaSnapshots();

      if (snapshots.length > 0) {
        return snapshots;
      }

      this.logger.warn('Alpaca market data returned no snapshots; falling back to mock snapshots.');
    }

    return this.getMockSnapshots();
  }

  private async getAlpacaSnapshots(): Promise<MarketSnapshot[]> {
    if (!this.config.alpacaApiKeyId || !this.config.alpacaSecretKey) {
      this.logger.warn('Alpaca credentials are missing; cannot fetch Alpaca market data.');
      return [];
    }

    const symbols = this.config.watchlistUs;
    if (symbols.length === 0) {
      this.logger.warn('WATCHLIST_US is empty; cannot fetch Alpaca market data.');
      return [];
    }

    const url = new URL('/v2/stocks/bars/latest', this.config.alpacaDataBaseUrl);
    url.searchParams.set('symbols', symbols.join(','));

    try {
      const response = await fetch(url, {
        headers: {
          'APCA-API-KEY-ID': this.config.alpacaApiKeyId,
          'APCA-API-SECRET-KEY': this.config.alpacaSecretKey,
        },
      });

      if (!response.ok) {
        this.logger.warn(`Alpaca market data request failed with HTTP ${response.status}.`);
        return [];
      }

      const payload = (await response.json()) as AlpacaLatestBarsResponse;
      const capturedAt = new Date();

      return Object.entries(payload.bars ?? {}).flatMap(([symbol, bar]) => {
        if (!bar.c || !bar.o) {
          return [];
        }

        return [
          {
            symbol: `US.${symbol}`,
            market: 'US' as const,
            name: symbol,
            currency: 'USD' as const,
            lastPrice: bar.c,
            previousClose: bar.o,
            changePercent: ((bar.c - bar.o) / bar.o) * 100,
            volume: bar.v ?? 0,
            capturedAt: bar.t ? new Date(bar.t) : capturedAt,
          },
        ];
      });
    } catch (error) {
      this.logger.warn(
        `Alpaca market data request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  private getMockSnapshots(): MarketSnapshot[] {
    const capturedAt = new Date();

    return [
      {
        symbol: 'MY.MAYBANK',
        market: 'MY',
        name: 'Malayan Banking Berhad',
        currency: 'MYR',
        lastPrice: 9.82,
        previousClose: 9.76,
        changePercent: 0.61,
        volume: 12_450_000,
        capturedAt,
      },
      {
        symbol: 'MY.TENAGA',
        market: 'MY',
        name: 'Tenaga Nasional Berhad',
        currency: 'MYR',
        lastPrice: 13.14,
        previousClose: 13.2,
        changePercent: -0.45,
        volume: 4_110_000,
        capturedAt,
      },
      {
        symbol: 'US.AAPL',
        market: 'US',
        name: 'Apple Inc.',
        currency: 'USD',
        lastPrice: 196.45,
        previousClose: 194.12,
        changePercent: 1.2,
        volume: 54_200_000,
        capturedAt,
      },
      {
        symbol: 'US.MSFT',
        market: 'US',
        name: 'Microsoft Corporation',
        currency: 'USD',
        lastPrice: 477.9,
        previousClose: 480.15,
        changePercent: -0.47,
        volume: 18_900_000,
        capturedAt,
      },
    ];
  }
}
