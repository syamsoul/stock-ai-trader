import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import {
  AiRecommendationResult,
  MarketSnapshot,
  TradeAction,
} from '../common/trading.types';
import { AppConfigService } from '../config/app-config.service';

interface AiRecommendationJson {
  action: TradeAction;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  reason: string;
}

@Injectable()
export class AiDecisionService {
  private readonly logger = new Logger(AiDecisionService.name);

  constructor(private readonly config: AppConfigService) {}

  async analyze(snapshot: MarketSnapshot): Promise<AiRecommendationResult> {
    if (!this.config.openAiApiKey) {
      return this.mockRecommendation(snapshot, 'OPENAI_API_KEY is not configured.');
    }

    try {
      const client = new OpenAI({ apiKey: this.config.openAiApiKey });
      const response = await client.responses.create({
        model: this.config.openAiModel,
        input: [
          {
            role: 'system',
            content:
              'You are a cautious stock market analyst. Return only JSON with action, confidence, riskLevel, and reason. You do not place trades.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              instruction:
                'Analyze this market snapshot for paper trading. Prefer HOLD unless the signal is strong.',
              snapshot,
            }),
          },
        ],
      });

      const parsed = this.parseRecommendation(response.output_text);

      return {
        ...parsed,
        model: this.config.openAiModel,
        raw: {
          provider: 'openai',
          outputText: response.output_text,
        },
      };
    } catch (error) {
      this.logger.warn(
        `OpenAI analysis failed, using fallback: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return this.mockRecommendation(snapshot, 'OpenAI request failed; fallback used.');
    }
  }

  private parseRecommendation(outputText: string): AiRecommendationJson {
    const parsed = JSON.parse(outputText) as Partial<AiRecommendationJson>;

    if (
      parsed.action !== 'BUY' &&
      parsed.action !== 'SELL' &&
      parsed.action !== 'HOLD'
    ) {
      throw new Error('AI response action must be BUY, SELL, or HOLD.');
    }

    const confidence =
      typeof parsed.confidence === 'number'
        ? Math.min(1, Math.max(0, parsed.confidence))
        : 0;

    const riskLevel =
      parsed.riskLevel === 'low' ||
      parsed.riskLevel === 'medium' ||
      parsed.riskLevel === 'high'
        ? parsed.riskLevel
        : 'high';

    return {
      action: parsed.action,
      confidence,
      riskLevel,
      reason: parsed.reason ?? 'No reason supplied by AI response.',
    };
  }

  private mockRecommendation(
    snapshot: MarketSnapshot,
    reason: string,
  ): AiRecommendationResult {
    return {
      action: 'HOLD',
      confidence: 0.5,
      riskLevel: 'medium',
      reason: `${reason} Mock analyst is holding ${snapshot.symbol}.`,
      model: 'mock-analyst',
      raw: {
        provider: 'mock',
        fallbackMode: this.config.aiFallbackMode,
      },
    };
  }
}
