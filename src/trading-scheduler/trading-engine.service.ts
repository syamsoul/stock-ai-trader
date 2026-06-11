import { Injectable, Logger } from '@nestjs/common';
import { AiDecisionService } from '../ai-decision/ai-decision.service';
import { AuditService } from '../audit/audit.service';
import { BrokerService } from '../broker/broker.service';
import { BrokerOrderRequest } from '../common/trading.types';
import { MarketService } from '../market/market.service';
import { RiskService } from '../risk/risk.service';

@Injectable()
export class TradingEngineService {
  private readonly logger = new Logger(TradingEngineService.name);

  constructor(
    private readonly marketService: MarketService,
    private readonly aiDecisionService: AiDecisionService,
    private readonly riskService: RiskService,
    private readonly brokerService: BrokerService,
    private readonly auditService: AuditService,
  ) {}

  async managePositionExits() {
    const positions = await this.brokerService.listPositions();
    const exitOrders = [];

    for (const position of positions) {
      if (position.exitSignal === 'HOLD') {
        continue;
      }

      const result = await this.brokerService.closePosition(
        position,
        `${position.exitSignal} triggered at ${position.currentPrice}. Unrealized P/L: ${position.unrealizedProfitLoss}.`,
      );
      exitOrders.push({ position, result });
    }

    return {
      positions,
      exitOrders,
    };
  }

  async runScheduledAnalysis(): Promise<void> {
    const run = await this.auditService.startRun();
    let analyzedCount = 0;
    let approvedOrderCount = 0;

    try {
      const snapshots = await this.marketService.getWatchlistSnapshots();

      for (const snapshot of snapshots) {
        analyzedCount += 1;
        const recommendation = await this.aiDecisionService.analyze(snapshot);
        await this.auditService.recordRecommendation(
          run.id,
          snapshot,
          recommendation,
        );

        const risk = this.riskService.assess(snapshot, recommendation);
        await this.auditService.recordRiskDecision(run.id, snapshot, risk);

        if (!risk.approved || recommendation.action === 'HOLD') {
          continue;
        }

        const orderRequest: BrokerOrderRequest = {
          symbol: snapshot.symbol,
          market: snapshot.market,
          side: recommendation.action,
          quantity: risk.quantity,
          orderType: risk.orderType,
          limitPrice: risk.limitPrice,
          rationale: recommendation.reason,
        };

        const orderResult = await this.brokerService.placePaperOrder(orderRequest);
        await this.auditService.recordPaperOrder(run.id, orderRequest, orderResult);
        approvedOrderCount += 1;
      }

      await this.auditService.completeRun(
        run.id,
        analyzedCount,
        approvedOrderCount,
      );
      this.logger.log(
        `Completed trading analysis run ${run.id}: analyzed=${analyzedCount}, paperOrders=${approvedOrderCount}`,
      );
    } catch (error) {
      await this.auditService.failRun(run.id, error);
      throw error;
    }
  }
}
