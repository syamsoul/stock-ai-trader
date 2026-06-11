import { MarketSnapshot } from '../common/trading.types';
import { AppConfigService } from '../config/app-config.service';
import { RiskService } from './risk.service';

const snapshot: MarketSnapshot = {
  symbol: 'US.AAPL',
  market: 'US',
  name: 'Apple Inc.',
  currency: 'USD',
  lastPrice: 196.45,
  previousClose: 194.12,
  changePercent: 1.2,
  volume: 54_200_000,
  capturedAt: new Date(),
};

describe('RiskService', () => {
  it('does not block live trading mode by itself', () => {
    const service = new RiskService({
      brokerEnv: 'REAL',
      liveTradingEnabled: true,
      aiMinConfidence: 0.75,
    } as AppConfigService);

    const result = service.assess(snapshot, {
      action: 'BUY',
      confidence: 0.9,
      riskLevel: 'low',
      reason: 'Strong mock signal.',
      model: 'test',
      raw: {},
    });

    expect(result.approved).toBe(true);
    expect(result.reasons).toContain('Approved for configured broker order.');
  });

  it('approves a high-confidence paper trade', () => {
    const service = new RiskService({
      brokerEnv: 'SIMULATE',
      liveTradingEnabled: false,
      aiMinConfidence: 0.75,
    } as AppConfigService);

    const result = service.assess(snapshot, {
      action: 'BUY',
      confidence: 0.9,
      riskLevel: 'low',
      reason: 'Strong mock signal.',
      model: 'test',
      raw: {},
    });

    expect(result.approved).toBe(true);
    expect(result.quantity).toBe(1);
  });

  it('still blocks low-confidence recommendations', () => {
    const service = new RiskService({
      brokerEnv: 'SIMULATE',
      liveTradingEnabled: false,
      aiMinConfidence: 0.75,
    } as AppConfigService);

    const result = service.assess(snapshot, {
      action: 'BUY',
      confidence: 0.5,
      riskLevel: 'medium',
      reason: 'Weak signal.',
      model: 'test',
      raw: {},
    });

    expect(result.approved).toBe(false);
  });
});
