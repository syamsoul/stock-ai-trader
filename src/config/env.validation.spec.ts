import { validateEnv } from './env.validation';

const baseEnv = {
  DATABASE_URL:
    'postgresql://stock_ai_trader:stock_ai_trader@postgres:5432/stock_ai_trader?schema=public',
};

describe('validateEnv', () => {
  it('accepts safe mock defaults', () => {
    const env = validateEnv(baseEnv);

    expect(env.BROKER_PROVIDER).toBe('mock');
    expect(env.BROKER_ENV).toBe('SIMULATE');
    expect(env.ENABLE_LIVE_TRADING).toBe(false);
  });

  it('accepts Alpaca paper trading config', () => {
    const env = validateEnv({
      ...baseEnv,
      BROKER_PROVIDER: 'alpaca',
      BROKER_ENV: 'SIMULATE',
      ALPACA_API_KEY_ID: 'paper-key-id',
      ALPACA_SECRET_KEY: 'paper-secret-key',
    });

    expect(env.BROKER_PROVIDER).toBe('alpaca');
    expect(env.BROKER_ENV).toBe('SIMULATE');
  });

  it('rejects Alpaca config without keys', () => {
    expect(() =>
      validateEnv({
        ...baseEnv,
        BROKER_PROVIDER: 'alpaca',
      }),
    ).toThrow(/ALPACA_API_KEY_ID/);
  });

  it('accepts Moomoo simulate paper trading config before account IDs are known', () => {
    const env = validateEnv({
      ...baseEnv,
      BROKER_PROVIDER: 'moomoo',
      BROKER_ENV: 'SIMULATE',
    });

    expect(env.BROKER_PROVIDER).toBe('moomoo');
    expect(env.BROKER_ENV).toBe('SIMULATE');
  });

  it('accepts explicit Moomoo real trading config', () => {
    const env = validateEnv({
      ...baseEnv,
      BROKER_PROVIDER: 'moomoo',
      BROKER_ENV: 'REAL',
      ENABLE_LIVE_TRADING: 'true',
      MOOMOO_ACCOUNT_ID_US: 'us-live-account',
      MOOMOO_TRADE_UNLOCK_PASSWORD: 'unlock-password',
    });

    expect(env.BROKER_ENV).toBe('REAL');
    expect(env.ENABLE_LIVE_TRADING).toBe(true);
  });

  it('rejects ambiguous real trading config', () => {
    expect(() =>
      validateEnv({
        ...baseEnv,
        BROKER_PROVIDER: 'moomoo',
        BROKER_ENV: 'REAL',
        MOOMOO_ACCOUNT_ID_US: 'us-live-account',
      }),
    ).toThrow(/ENABLE_LIVE_TRADING=true/);
  });
});
