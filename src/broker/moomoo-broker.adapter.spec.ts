import { AppConfigService } from '../config/app-config.service';
import { MoomooBrokerAdapter } from './moomoo-broker.adapter';

const placeOrder = jest.fn();
const getAccList = jest.fn();

jest.mock('moomoo-api', () => {
  return jest.fn().mockImplementation(() => ({
    onlogin: undefined,
    start() {
      setImmediate(() => this.onlogin?.(true, 'ok'));
    },
    stop: jest.fn(),
    getConnID: jest.fn().mockReturnValue(123),
    GetAccList: getAccList,
    PlaceOrder: placeOrder,
  }));
});

describe('MoomooBrokerAdapter', () => {
  beforeEach(() => {
    getAccList.mockResolvedValue({
      s2c: {
        accList: [
          {
            accID: 'my-paper-account',
            trdEnv: 0,
            trdMarketAuthList: [111],
          },
        ],
      },
    });
    placeOrder.mockResolvedValue({
      s2c: {
        orderID: 'paper-order-1',
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('submits a Moomoo simulate order through OpenD', async () => {
    const adapter = new MoomooBrokerAdapter({
      brokerEnv: 'SIMULATE',
      moomooAccountIdMy: 'my-paper-account',
      moomooAccountIdUs: '',
      moomooOpenDHost: 'host.docker.internal',
      moomooOpenDPort: 11111,
      moomooOpenDSsl: false,
      moomooOpenDKey: '',
    } as AppConfigService);

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
      status: 'SUBMITTED',
      brokerOrderId: 'paper-order-1',
    });

    expect(placeOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        c2s: expect.objectContaining({
          code: '1155',
          qty: 100,
          price: 1,
        }),
      }),
    );
  });
});
