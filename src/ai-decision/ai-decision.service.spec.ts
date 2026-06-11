import { AiDecisionService } from './ai-decision.service';
import { AppConfigService } from '../config/app-config.service';
import { MarketSnapshot } from '../common/trading.types';

const snapshot: MarketSnapshot = {
  symbol: 'MY.MAYBANK',
  market: 'MY',
  name: 'Malayan Banking Berhad',
  currency: 'MYR',
  lastPrice: 9.82,
  previousClose: 9.76,
  changePercent: 0.61,
  volume: 12_450_000,
  capturedAt: new Date(),
};

describe('AiDecisionService', () => {
  it('returns mock HOLD when OpenAI key is missing', async () => {
    const service = new AiDecisionService({
      openAiApiKey: '',
      aiFallbackMode: 'mock',
    } as AppConfigService);

    await expect(service.analyze(snapshot)).resolves.toMatchObject({
      action: 'HOLD',
      model: 'mock-analyst',
    });
  });
});
