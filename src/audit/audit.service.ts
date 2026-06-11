import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AiRecommendationResult,
  BrokerOrderRequest,
  BrokerOrderResult,
  MarketSnapshot,
  RiskAssessment,
} from '../common/trading.types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async listRuns(limit = 10) {
    return this.prisma.schedulerRun.findMany({
      take: Math.min(Math.max(limit, 1), 50),
      orderBy: { startedAt: 'desc' },
      include: {
        recommendations: { orderBy: { createdAt: 'desc' } },
        riskDecisions: { orderBy: { createdAt: 'desc' } },
        paperOrders: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async listTradePlans(limit = 20) {
    const recommendations = await this.prisma.aiRecommendation.findMany({
      take: Math.min(Math.max(limit, 1), 100),
      where: {
        action: { not: 'HOLD' },
      },
      orderBy: { createdAt: 'desc' },
    });

    const runIds = [...new Set(recommendations.map((item) => item.schedulerRunId))];
    const [riskDecisions, paperOrders] = await Promise.all([
      this.prisma.riskDecision.findMany({
        where: { schedulerRunId: { in: runIds } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.paperOrder.findMany({
        where: { schedulerRunId: { in: runIds } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return recommendations.map((recommendation) => {
      const risk = riskDecisions.find(
        (item) =>
          item.schedulerRunId === recommendation.schedulerRunId &&
          item.symbol === recommendation.symbol &&
          item.market === recommendation.market,
      );
      const order = paperOrders.find(
        (item) =>
          item.schedulerRunId === recommendation.schedulerRunId &&
          item.symbol === recommendation.symbol &&
          item.market === recommendation.market,
      );

      return {
        schedulerRunId: recommendation.schedulerRunId,
        symbol: recommendation.symbol,
        market: recommendation.market,
        action: recommendation.action,
        confidence: recommendation.confidence,
        riskLevel: recommendation.riskLevel,
        reason: recommendation.reason,
        model: recommendation.model,
        createdAt: recommendation.createdAt,
        riskApproved: risk?.approved ?? false,
        riskReasons: risk?.reasons ?? ['Risk decision not found.'],
        orderStatus: order?.status ?? 'NO_ORDER',
        brokerOrderId: order?.brokerOrderId ?? null,
        orderRationale: order?.rationale ?? null,
      };
    });
  }

  async latestRun() {
    return this.prisma.schedulerRun.findFirst({
      orderBy: { startedAt: 'desc' },
      include: {
        recommendations: { orderBy: { createdAt: 'desc' } },
        riskDecisions: { orderBy: { createdAt: 'desc' } },
        paperOrders: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async startRun() {
    return this.prisma.schedulerRun.create({
      data: {
        status: 'RUNNING',
      },
    });
  }

  async completeRun(
    runId: string,
    analyzedCount: number,
    approvedOrderCount: number,
  ) {
    return this.prisma.schedulerRun.update({
      where: { id: runId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        analyzedCount,
        approvedOrderCount,
      },
    });
  }

  async failRun(runId: string, error: unknown) {
    return this.prisma.schedulerRun.update({
      where: { id: runId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }

  async recordRecommendation(
    runId: string,
    snapshot: MarketSnapshot,
    recommendation: AiRecommendationResult,
  ) {
    return this.prisma.aiRecommendation.create({
      data: {
        schedulerRunId: runId,
        symbol: snapshot.symbol,
        market: snapshot.market,
        action: recommendation.action,
        confidence: recommendation.confidence,
        riskLevel: recommendation.riskLevel,
        reason: recommendation.reason,
        model: recommendation.model,
        raw: recommendation.raw as Prisma.InputJsonValue,
      },
    });
  }

  async recordRiskDecision(
    runId: string,
    snapshot: MarketSnapshot,
    risk: RiskAssessment,
  ) {
    return this.prisma.riskDecision.create({
      data: {
        schedulerRunId: runId,
        symbol: snapshot.symbol,
        market: snapshot.market,
        approved: risk.approved,
        reasons: risk.reasons,
      },
    });
  }

  async recordPaperOrder(
    runId: string,
    request: BrokerOrderRequest,
    result: BrokerOrderResult,
  ) {
    return this.prisma.paperOrder.create({
      data: {
        schedulerRunId: runId,
        symbol: request.symbol,
        market: request.market,
        side: request.side,
        quantity: request.quantity,
        orderType: request.orderType,
        limitPrice: request.limitPrice,
        status: result.status,
        brokerOrderId: result.brokerOrderId,
        rationale: result.message
          ? `${request.rationale} Broker message: ${result.message}`
          : request.rationale,
      },
    });
  }
}
