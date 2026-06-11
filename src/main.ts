import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(AppConfigService);
  const logger = new Logger('Bootstrap');

  await app.listen(config.port);
  logger.log(`stock-ai-trader listening on port ${config.port}`);
}

void bootstrap();
