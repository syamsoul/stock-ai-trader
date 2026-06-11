import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('runs')
  async listRuns(@Query('limit') limit?: string) {
    return this.auditService.listRuns(Number(limit ?? 10));
  }

  @Get('runs/latest')
  async latestRun() {
    return this.auditService.latestRun();
  }

  @Get('trade-plans')
  async listTradePlans(@Query('limit') limit?: string) {
    return this.auditService.listTradePlans(Number(limit ?? 20));
  }
}
