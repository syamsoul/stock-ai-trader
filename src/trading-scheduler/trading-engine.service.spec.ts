import { TradingEngineService } from './trading-engine.service';
import { MarketSnapshot } from '../common/trading.types';

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

describe('TradingEngineService', () => {
  it('creates audit records and mock paper order when risk approves', async () => {
    const marketService = {
      getWatchlistSnapshots: jest.fn().mockResolvedValue([snapshot]),
    };
    const recommendation = {
      action: 'BUY',
      confidence: 0.9,
      riskLevel: 'low',
      reason: 'Approved test signal.',
      model: 'test',
      raw: {},
    };
    const aiDecisionService = {
      analyze: jest.fn().mockResolvedValue(recommendation),
    };
    const risk = {
      approved: true,
      reasons: ['Approved for mock paper order.'],
      quantity: 1,
      orderType: 'LIMIT',
      limitPrice: snapshot.lastPrice,
    };
    const riskService = {
      assess: jest.fn().mockReturnValue(risk),
    };
    const brokerService = {
      placePaperOrder: jest.fn().mockResolvedValue({
        brokerOrderId: 'mock_order_1',
        status: 'SUBMITTED',
      }),
    };
    const auditService = {
      startRun: jest.fn().mockResolvedValue({ id: 'run_1' }),
      completeRun: jest.fn().mockResolvedValue(undefined),
      failRun: jest.fn().mockResolvedValue(undefined),
      recordRecommendation: jest.fn().mockResolvedValue(undefined),
      recordRiskDecision: jest.fn().mockResolvedValue(undefined),
      recordPaperOrder: jest.fn().mockResolvedValue(undefined),
    };

    const service = new TradingEngineService(
      marketService as never,
      aiDecisionService as never,
      riskService as never,
      brokerService as never,
      auditService as never,
    );

    await service.runScheduledAnalysis();

    expect(auditService.recordRecommendation).toHaveBeenCalledWith(
      'run_1',
      snapshot,
      recommendation,
    );
    expect(auditService.recordRiskDecision).toHaveBeenCalledWith(
      'run_1',
      snapshot,
      risk,
    );
    expect(brokerService.placePaperOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        symbol: 'US.AAPL',
        side: 'BUY',
        quantity: 1,
      }),
    );
    expect(auditService.recordPaperOrder).toHaveBeenCalledWith(
      'run_1',
      expect.objectContaining({ symbol: 'US.AAPL' }),
      expect.objectContaining({ brokerOrderId: 'mock_order_1' }),
    );
    expect(auditService.completeRun).toHaveBeenCalledWith('run_1', 1, 1);
  });
});
