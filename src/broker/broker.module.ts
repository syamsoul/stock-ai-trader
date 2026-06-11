import { Module } from '@nestjs/common';
import { AlpacaBrokerAdapter } from './alpaca-broker.adapter';
import { BrokerTestController } from './broker-test.controller';
import { BrokerService } from './broker.service';
import { MoomooBrokerAdapter } from './moomoo-broker.adapter';
import { MockBrokerAdapter } from './mock-broker.adapter';

@Module({
  controllers: [BrokerTestController],
  providers: [MockBrokerAdapter, MoomooBrokerAdapter, AlpacaBrokerAdapter, BrokerService],
  exports: [BrokerService],
})
export class BrokerModule {}
