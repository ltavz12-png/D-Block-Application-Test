import { Injectable, BadRequestException } from '@nestjs/common';
import { PaymentGateway } from '@/common/database/entities/payment.entity';
import { IPaymentGateway } from './payment-gateway.interface';
import { MockGateway } from './mock-gateway';
import { BogIpayGateway } from './bog-ipay.gateway';
import { TbcTpayGateway } from './tbc-tpay.gateway';

@Injectable()
export class GatewayFactory {
  private readonly gateways: Map<PaymentGateway, IPaymentGateway>;

  constructor(
    private readonly mockGateway: MockGateway,
    private readonly bogIpayGateway: BogIpayGateway,
    private readonly tbcTpayGateway: TbcTpayGateway,
  ) {
    this.gateways = new Map<PaymentGateway, IPaymentGateway>([
      [PaymentGateway.MOCK, this.mockGateway],
      [PaymentGateway.BOG_IPAY, this.bogIpayGateway],
      [PaymentGateway.TBC_TPAY, this.tbcTpayGateway],
    ]);
  }

  getGateway(gateway: PaymentGateway): IPaymentGateway {
    const instance = this.gateways.get(gateway);

    if (!instance) {
      throw new BadRequestException(
        `Unsupported payment gateway: ${gateway}`,
      );
    }

    return instance;
  }
}
