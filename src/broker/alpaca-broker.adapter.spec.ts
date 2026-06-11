import { AppConfigService } from '../config/app-config.service';
import { AlpacaBrokerAdapter } from './alpaca-broker.adapter';

describe('AlpacaBrokerAdapter', () => {
  const fetchMock = jest.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('submits a US limit order to Alpaca paper endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'alpaca-order-1', status: 'accepted' }),
    });

    const adapter = new AlpacaBrokerAdapter({
      brokerEnv: 'SIMULATE',
      alpacaBaseUrl: 'https://paper-api.alpaca.markets',
      alpacaApiKeyId: 'key-id',
      alpacaSecretKey: 'secret-key',
    } as AppConfigService);

    await expect(
      adapter.placeOrder({
        symbol: 'US.AAPL',
        market: 'US',
        side: 'BUY',
        quantity: 1,
        orderType: 'LIMIT',
        limitPrice: 1,
        rationale: 'Test order.',
      }),
    ).resolves.toMatchObject({
      brokerOrderId: 'alpaca-order-1',
      status: 'SUBMITTED',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://paper-api.alpaca.markets/v2/orders',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'APCA-API-KEY-ID': 'key-id',
          'APCA-API-SECRET-KEY': 'secret-key',
        }),
        body: expect.stringContaining('AAPL'),
      }),
    );
  });

  it('rejects non-US markets before calling Alpaca', async () => {
    const adapter = new AlpacaBrokerAdapter({} as AppConfigService);

    await expect(
      adapter.placeOrder({
        symbol: '1155',
        market: 'MY',
        side: 'BUY',
        quantity: 100,
        orderType: 'LIMIT',
        limitPrice: 1,
        rationale: 'Test order.',
      }),
    ).resolves.toMatchObject({
      status: 'REJECTED',
      message: 'Alpaca adapter only supports US market orders.',
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
