import { z } from 'zod';

const booleanFromString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const envSchema = z
  .object({
    NODE_ENV: z.string().default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().url(),
    SCHEDULER_ENABLED: booleanFromString.default('true'),
    SCHEDULER_CRON: z.string().min(1).default('0 */20 * * * *'),
    BROKER_PROVIDER: z.enum(['mock', 'moomoo', 'alpaca']).default('mock'),
    BROKER_ENV: z.enum(['SIMULATE', 'REAL']).default('SIMULATE'),
    ENABLE_LIVE_TRADING: booleanFromString.default('false'),
    ALPACA_API_KEY_ID: z.string().default(''),
    ALPACA_SECRET_KEY: z.string().default(''),
    ALPACA_PAPER_BASE_URL: z.string().url().default('https://paper-api.alpaca.markets'),
    ALPACA_LIVE_BASE_URL: z.string().url().default('https://api.alpaca.markets'),
    ALPACA_DATA_BASE_URL: z.string().url().default('https://data.alpaca.markets'),
    MARKET_DATA_PROVIDER: z.enum(['mock', 'alpaca']).default('mock'),
    WATCHLIST_US: z.string().default('AAPL,MSFT,NVDA,TSLA'),
    AI_TRADING_STYLE: z.enum(['conservative', 'active']).default('conservative'),
    MOOMOO_OPEND_HOST: z.string().default('host.docker.internal'),
    MOOMOO_OPEND_PORT: z.coerce.number().int().positive().default(11111),
    MOOMOO_OPEND_SSL: booleanFromString.default('false'),
    MOOMOO_OPEND_KEY: z.string().default(''),
    MOOMOO_SECURITY_FIRM: z.string().default('FUTU_MY'),
    MOOMOO_ACCOUNT_ID_MY: z.string().default(''),
    MOOMOO_ACCOUNT_ID_US: z.string().default(''),
    MOOMOO_TRADE_UNLOCK_PASSWORD: z.string().default(''),
    OPENAI_API_KEY: z.string().default(''),
    OPENAI_MODEL: z.string().default('gpt-5.5'),
    AI_FALLBACK_MODE: z.enum(['mock', 'off']).default('mock'),
    AI_MIN_CONFIDENCE: z.coerce.number().min(0).max(1).default(0.75),
    ENTRY_LIMIT_BUFFER_PERCENT: z.coerce.number().min(0).max(5).default(0.25),
    DEFAULT_TAKE_PROFIT_PERCENT: z.coerce.number().positive().default(1.5),
    DEFAULT_STOP_LOSS_PERCENT: z.coerce.number().positive().default(0.75),
  })
  .superRefine((env, ctx) => {
    const errors: Array<[keyof typeof env, string]> = [];

    if (env.BROKER_PROVIDER === 'mock' && env.BROKER_ENV === 'REAL') {
      errors.push([
        'BROKER_ENV',
        'Mock broker only supports BROKER_ENV=SIMULATE. Use a real broker provider for REAL trading.',
      ]);
    }

    if (env.ENABLE_LIVE_TRADING && env.BROKER_PROVIDER === 'mock') {
      errors.push([
        'BROKER_PROVIDER',
        'Live trading requires BROKER_PROVIDER=moomoo or BROKER_PROVIDER=alpaca.',
      ]);
    }

    if (env.BROKER_PROVIDER === 'alpaca') {
      if (!env.ALPACA_API_KEY_ID) {
        errors.push(['ALPACA_API_KEY_ID', 'Alpaca broker requires ALPACA_API_KEY_ID.']);
      }

      if (!env.ALPACA_SECRET_KEY) {
        errors.push(['ALPACA_SECRET_KEY', 'Alpaca broker requires ALPACA_SECRET_KEY.']);
      }
    }

    if (env.BROKER_PROVIDER === 'moomoo' && !env.MOOMOO_OPEND_HOST) {
      errors.push([
        'MOOMOO_OPEND_HOST',
        'Moomoo broker requires MOOMOO_OPEND_HOST.',
      ]);
    }

    if (env.BROKER_ENV === 'REAL' && !env.ENABLE_LIVE_TRADING) {
      errors.push([
        'ENABLE_LIVE_TRADING',
        'REAL broker environment requires ENABLE_LIVE_TRADING=true.',
      ]);
    }

    if (env.BROKER_PROVIDER === 'moomoo' && env.BROKER_ENV === 'REAL' && !env.MOOMOO_ACCOUNT_ID_MY && !env.MOOMOO_ACCOUNT_ID_US) {
      errors.push([
        'MOOMOO_ACCOUNT_ID_MY',
        'REAL Moomoo trading requires at least one account ID.',
      ]);
    }

    if (env.BROKER_PROVIDER === 'moomoo' && env.BROKER_ENV === 'REAL' && !env.MOOMOO_TRADE_UNLOCK_PASSWORD) {
      errors.push([
        'MOOMOO_TRADE_UNLOCK_PASSWORD',
        'REAL Moomoo trading requires a trade unlock password.',
      ]);
    }

    for (const [path, message] of errors) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [path],
        message,
      });
    }
  });

export type ValidatedEnv = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): ValidatedEnv {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return parsed.data;
}
