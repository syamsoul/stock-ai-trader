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
            content: this.systemPrompt(),
          },
          {
            role: 'user',
            content: JSON.stringify({
              instruction: this.analysisInstruction(),
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


  private systemPrompt(): string {
    if (this.config.aiTradingStyle === 'active') {
      return [
        'You are a paper-trading stock analyst for a demo account.',
        'Return only JSON with action, confidence, riskLevel, and reason.',
        'You do not place trades; the application risk engine and broker adapter handle that.',
        'For active paper trading, look for a reasonable trade from momentum and liquidity.',
        'Prefer BUY when price is above the latest bar open with meaningful volume.',
        'Use HOLD only when data is invalid, price action is flat, or the setup is clearly poor.',
      ].join(' ');
    }

    return 'You are a cautious stock market analyst. Return only JSON with action, confidence, riskLevel, and reason. You do not place trades.';
  }

  private analysisInstruction(): string {
    if (this.config.aiTradingStyle === 'active') {
      return 'Analyze this latest market snapshot for Alpaca paper trading. Choose BUY, SELL, or HOLD. In active paper mode, do not default to HOLD when there is positive or negative momentum. Keep the confidence realistic between 0 and 1.';
    }

    return 'Analyze this market snapshot for paper trading. Prefer HOLD unless the signal is strong.';
  }

  private extractJson(outputText: string): string {
    const trimmed = outputText.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return trimmed;
    }

    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return trimmed.slice(start, end + 1);
    }

    throw new Error('AI response did not contain a JSON object.');
  }

  private parseRecommendation(outputText: string): AiRecommendationJson {
    const jsonText = this.extractJson(outputText);
    const parsed = JSON.parse(jsonText) as Partial<AiRecommendationJson>;

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
