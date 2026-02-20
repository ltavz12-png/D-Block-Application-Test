import { Module } from '@nestjs/common';
import { BusinessCentralController } from './business-central.controller';
import { BusinessCentralService } from './business-central.service';
import { BusinessCentralGateway } from './business-central.gateway';
import { BusinessCentralMockGateway } from './business-central-mock.gateway';

@Module({
  imports: [],
  controllers: [BusinessCentralController],
  providers: [
    BusinessCentralService,
    BusinessCentralGateway,
    BusinessCentralMockGateway,
  ],
  exports: [BusinessCentralService],
})
export class BusinessCentralModule {}
