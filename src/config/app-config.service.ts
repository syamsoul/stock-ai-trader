import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiFallbackMode,
  BrokerEnvironment,
  BrokerProvider,
} from '../common/trading.types';
import { ValidatedEnv } from './env.validation';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<ValidatedEnv, true>) {}

  get port(): number {
    return this.config.get('PORT', { infer: true });
  }

  get schedulerEnabled(): boolean {
    return this.config.get('SCHEDULER_ENABLED', { infer: true });
  }

  get schedulerCron(): string {
    return this.config.get('SCHEDULER_CRON', { infer: true });
  }

  get brokerProvider(): BrokerProvider {
    return this.config.get('BROKER_PROVIDER', { infer: true });
  }

  get brokerEnv(): BrokerEnvironment {
    return this.config.get('BROKER_ENV', { infer: true });
  }

  get liveTradingEnabled(): boolean {
    return this.config.get('ENABLE_LIVE_TRADING', { infer: true });
  }

  get openAiApiKey(): string {
    return this.config.get('OPENAI_API_KEY', { infer: true });
  }

  get openAiModel(): string {
    return this.config.get('OPENAI_MODEL', { infer: true });
  }

  get aiFallbackMode(): AiFallbackMode {
    return this.config.get('AI_FALLBACK_MODE', { infer: true });
  }

  get aiMinConfidence(): number {
    return this.config.get('AI_MIN_CONFIDENCE', { infer: true });
  }

  get aiTradingStyle(): 'conservative' | 'active' {
    return this.config.get('AI_TRADING_STYLE', { infer: true });
  }

  get marketDataProvider(): 'mock' | 'alpaca' {
    return this.config.get('MARKET_DATA_PROVIDER', { infer: true });
  }

  get watchlistUs(): string[] {
    return this.config
      .get('WATCHLIST_US', { infer: true })
      .split(',')
      .map((symbol) => symbol.trim())
      .filter(Boolean);
  }

  get entryLimitBufferPercent(): number {
    return this.config.get('ENTRY_LIMIT_BUFFER_PERCENT', { infer: true });
  }

  get defaultTakeProfitPercent(): number {
    return this.config.get('DEFAULT_TAKE_PROFIT_PERCENT', { infer: true });
  }

  get defaultStopLossPercent(): number {
    return this.config.get('DEFAULT_STOP_LOSS_PERCENT', { infer: true });
  }

  get alpacaApiKeyId(): string {
    return this.config.get('ALPACA_API_KEY_ID', { infer: true });
  }

  get alpacaSecretKey(): string {
    return this.config.get('ALPACA_SECRET_KEY', { infer: true });
  }

  get alpacaBaseUrl(): string {
    return this.brokerEnv === 'REAL'
      ? this.config.get('ALPACA_LIVE_BASE_URL', { infer: true })
      : this.config.get('ALPACA_PAPER_BASE_URL', { infer: true });
  }

  get alpacaDataBaseUrl(): string {
    return this.config.get('ALPACA_DATA_BASE_URL', { infer: true });
  }

  get moomooOpenDHost(): string {
    return this.config.get('MOOMOO_OPEND_HOST', { infer: true });
  }

  get moomooOpenDPort(): number {
    return this.config.get('MOOMOO_OPEND_PORT', { infer: true });
  }

  get moomooOpenDSsl(): boolean {
    return this.config.get('MOOMOO_OPEND_SSL', { infer: true });
  }

  get moomooOpenDKey(): string {
    return this.config.get('MOOMOO_OPEND_KEY', { infer: true });
  }

  get moomooSecurityFirm(): string {
    return this.config.get('MOOMOO_SECURITY_FIRM', { infer: true });
  }

  get moomooAccountIdMy(): string {
    return this.config.get('MOOMOO_ACCOUNT_ID_MY', { infer: true });
  }

  get moomooAccountIdUs(): string {
    return this.config.get('MOOMOO_ACCOUNT_ID_US', { infer: true });
  }
}

