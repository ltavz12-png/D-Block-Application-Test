import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Payment } from '@/common/database/entities/payment.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MockGateway } from './gateways/mock-gateway';
import { BogIpayGateway } from './gateways/bog-ipay.gateway';
import { TbcTpayGateway } from './gateways/tbc-tpay.gateway';
import { GatewayFactory } from './gateways/gateway-factory';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    ConfigModule,
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    MockGateway,
    BogIpayGateway,
    TbcTpayGateway,
    GatewayFactory,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
