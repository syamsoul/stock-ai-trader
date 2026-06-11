import { Injectable } from '@nestjs/common';
import {
  AiRecommendationResult,
  MarketSnapshot,
  RiskAssessment,
} from '../common/trading.types';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class RiskService {
  constructor(private readonly config: AppConfigService) {}

  assess(
    snapshot: MarketSnapshot,
    recommendation: AiRecommendationResult,
  ): RiskAssessment {
    const reasons: string[] = [];

    if (recommendation.action === 'HOLD') {
      reasons.push('AI recommendation is HOLD.');
    }

    if (recommendation.confidence < this.config.aiMinConfidence) {
      reasons.push(
        `AI confidence ${recommendation.confidence.toFixed(
          2,
        )} is below minimum ${this.config.aiMinConfidence.toFixed(2)}.`,
      );
    }

    if (snapshot.lastPrice <= 0) {
      reasons.push('Snapshot last price must be positive.');
    }

    const approved = reasons.length === 0;

    return {
      approved,
      reasons: approved ? ['Approved for configured broker order.'] : reasons,
      quantity: approved ? 1 : 0,
      orderType: 'LIMIT',
      limitPrice: approved ? snapshot.lastPrice : null,
    };
  }
}
