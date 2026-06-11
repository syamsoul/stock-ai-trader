import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { AppConfigService } from '../config/app-config.service';
import { TradingEngineService } from './trading-engine.service';

@Injectable()
export class TradingSchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TradingSchedulerService.name);

  constructor(
    private readonly config: AppConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly tradingEngine: TradingEngineService,
  ) {}

  onApplicationBootstrap() {
    if (!this.config.schedulerEnabled) {
      this.logger.log('Trading scheduler is disabled.');
      return;
    }

    const job = new CronJob(this.config.schedulerCron, () => {
      void this.tradingEngine.runScheduledAnalysis().catch((error) => {
        this.logger.error(
          `Trading analysis run failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });
    });

    this.schedulerRegistry.addCronJob('trading-analysis', job);
    job.start();
    this.logger.log(
      `Trading scheduler registered with cron: ${this.config.schedulerCron}`,
    );
  }
}
