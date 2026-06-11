export type MarketCode = 'MY' | 'US';
export type TradeAction = 'BUY' | 'SELL' | 'HOLD';
export type BrokerEnvironment = 'SIMULATE' | 'REAL';
export type BrokerProvider = 'mock' | 'moomoo' | 'alpaca';
export type AiFallbackMode = 'mock' | 'off';

export interface MarketSnapshot {
  symbol: string;
  market: MarketCode;
  name: string;
  currency: 'MYR' | 'USD';
  lastPrice: number;
  previousClose: number;
  changePercent: number;
  volume: number;
  capturedAt: Date;
}

export interface AiRecommendationResult {
  action: TradeAction;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  reason: string;
  model: string;
  raw: Record<string, unknown>;
}

export interface RiskAssessment {
  approved: boolean;
  reasons: string[];
  quantity: number;
  orderType: 'LIMIT';
  limitPrice: number | null;
}

export interface BrokerOrderRequest {
  symbol: string;
  market: MarketCode;
  side: Exclude<TradeAction, 'HOLD'>;
  quantity: number;
  orderType: 'LIMIT';
  limitPrice: number | null;
  rationale: string;
}

export interface BrokerOrderResult {
  brokerOrderId: string;
  status: 'SUBMITTED' | 'REJECTED';
  message?: string;
}
