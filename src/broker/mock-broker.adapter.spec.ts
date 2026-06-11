import { MockBrokerAdapter } from './mock-broker.adapter';

describe('MockBrokerAdapter', () => {
  it('records an approved paper order as submitted', async () => {
    const adapter = new MockBrokerAdapter();

    await expect(
      adapter.placePaperOrder({
        symbol: 'US.AAPL',
        market: 'US',
        side: 'BUY',
        quantity: 1,
        orderType: 'LIMIT',
        limitPrice: 196.45,
        rationale: 'Test order.',
      }),
    ).resolves.toMatchObject({
      status: 'SUBMITTED',
    });
  });
});
