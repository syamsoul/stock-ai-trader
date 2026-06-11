import { Injectable } from '@nestjs/common';
import { MarketSnapshot } from '../common/trading.types';

@Injectable()
export class MarketService {
  async getWatchlistSnapshots(): Promise<MarketSnapshot[]> {
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
