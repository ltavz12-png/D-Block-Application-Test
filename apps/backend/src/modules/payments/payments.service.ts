import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Payment,
  PaymentStatus,
} from '@/common/database/entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ProcessRefundDto } from './dto/process-refund.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { GatewayFactory } from './gateways/gateway-factory';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly gatewayFactory: GatewayFactory,
  ) {}

  async createPayment(userId: string, dto: CreatePaymentDto) {
    const taxRate = dto.taxRate ?? 18;
    const taxAmount = Number(((dto.amount * taxRate) / 100).toFixed(2));

    const payment = this.paymentRepository.create({
      userId,
      amount: dto.amount,
      currency: dto.currency || 'GEL',
      paymentMethod: dto.paymentMethod,
      paymentGateway: dto.paymentGateway,
      status: PaymentStatus.PENDING,
      description: dto.description || null,
      metadata: dto.metadata || null,
      taxRate,
      taxAmount,
      refundAmount: 0,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    this.logger.log(
      `Payment created: id=${savedPayment.id}, userId=${userId}, amount=${dto.amount} ${dto.currency || 'GEL'}`,
    );

    const gateway = this.gatewayFactory.getGateway(savedPayment.paymentGateway);

    const result = await gateway.initializePayment({
      amount: dto.amount,
      currency: dto.currency || 'GEL',
      orderId: savedPayment.id,
      description: dto.description || `Payment ${savedPayment.id}`,
    });

    if (result.success) {
      savedPayment.gatewayTransactionId = result.transactionId;
      savedPayment.gatewayResponse = result.gatewayResponse;
      savedPayment.status =
        result.status === 'completed'
          ? PaymentStatus.COMPLETED
          : PaymentStatus.PROCESSING;
    } else {
      savedPayment.gatewayTransactionId = result.transactionId;
      savedPayment.gatewayResponse = result.gatewayResponse;
      savedPayment.status = PaymentStatus.FAILED;
    }

    await this.paymentRepository.save(savedPayment);

    this.logger.log(
      `Payment ${savedPayment.id} gateway result: success=${result.success}, status=${result.status}`,
    );

    const response: Record<string, any> = { payment: savedPayment };

    if (result.redirectUrl) {
      response.redirectUrl = result.redirectUrl;
    }

    return response;
  }

  async confirmPayment(paymentId: string) {
    const payment = await this.findById(paymentId);

    if (
      payment.status !== PaymentStatus.PENDING &&
      payment.status !== PaymentStatus.PROCESSING
    ) {
      throw new BadRequestException(
        `Payment ${paymentId} cannot be confirmed — current status: ${payment.status}`,
      );
    }

    const gateway = this.gatewayFactory.getGateway(payment.paymentGateway);

    const result = await gateway.confirmPayment(
      payment.gatewayTransactionId || payment.id,
    );

    if (result.success) {
      payment.status = PaymentStatus.COMPLETED;
    } else {
      payment.status = PaymentStatus.FAILED;
    }

    payment.gatewayResponse = result.gatewayResponse;

    await this.paymentRepository.save(payment);

    this.logger.log(
      `Payment ${paymentId} confirmed: success=${result.success}, status=${payment.status}`,
    );

    return payment;
  }

  async processRefund(paymentId: string, dto: ProcessRefundDto, userId: string) {
    const payment = await this.findById(paymentId);

    if (
      payment.status !== PaymentStatus.COMPLETED &&
      payment.status !== PaymentStatus.PARTIALLY_REFUNDED
    ) {
      throw new BadRequestException(
        `Payment ${paymentId} cannot be refunded — current status: ${payment.status}`,
      );
    }

    const currentRefund = Number(payment.refundAmount) || 0;
    const maxRefundable = Number(payment.amount) - currentRefund;

    if (dto.amount > maxRefundable) {
      throw new BadRequestException(
        `Refund amount ${dto.amount} exceeds maximum refundable amount ${maxRefundable}`,
      );
    }

    const gateway = this.gatewayFactory.getGateway(payment.paymentGateway);

    const result = await gateway.processRefund({
      transactionId: payment.gatewayTransactionId || payment.id,
      amount: dto.amount,
      reason: dto.reason,
    });

    if (!result.success) {
      throw new BadRequestException(
        `Refund failed at gateway: ${JSON.stringify(result.gatewayResponse)}`,
      );
    }

    const newRefundAmount = currentRefund + result.refundedAmount;

    payment.refundAmount = newRefundAmount;
    payment.refundedAt = new Date();
    payment.gatewayResponse = result.gatewayResponse;

    if (newRefundAmount >= Number(payment.amount)) {
      payment.status = PaymentStatus.REFUNDED;
    } else {
      payment.status = PaymentStatus.PARTIALLY_REFUNDED;
    }

    await this.paymentRepository.save(payment);

    this.logger.log(
      `Payment ${paymentId} refunded: amount=${dto.amount}, totalRefunded=${newRefundAmount}, by userId=${userId}`,
    );

    return payment;
  }

  async findAll(query: QueryPaymentDto): Promise<{
    data: Payment[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      userId,
      status,
      paymentMethod,
      paymentGateway,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = query;

    const qb = this.paymentRepository.createQueryBuilder('payment');

    if (userId) {
      qb.andWhere('payment.userId = :userId', { userId });
    }

    if (status) {
      qb.andWhere('payment.status = :status', { status });
    }

    if (paymentMethod) {
      qb.andWhere('payment.paymentMethod = :paymentMethod', { paymentMethod });
    }

    if (paymentGateway) {
      qb.andWhere('payment.paymentGateway = :paymentGateway', {
        paymentGateway,
      });
    }

    if (dateFrom) {
      qb.andWhere('payment.createdAt >= :dateFrom', {
        dateFrom: new Date(dateFrom),
      });
    }

    if (dateTo) {
      qb.andWhere('payment.createdAt <= :dateTo', {
        dateTo: new Date(dateTo),
      });
    }

    qb.orderBy('payment.createdAt', 'DESC');
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID "${id}" not found`);
    }

    return payment;
  }

  async findByUser(userId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getPaymentSummary(userId: string): Promise<{
    totalPaid: number;
    totalRefunded: number;
    count: number;
  }> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'totalPaid')
      .addSelect('COALESCE(SUM(payment.refund_amount), 0)', 'totalRefunded')
      .addSelect('COUNT(*)::int', 'count')
      .where('payment.userId = :userId', { userId })
      .andWhere('payment.status IN (:...statuses)', {
        statuses: [
          PaymentStatus.COMPLETED,
          PaymentStatus.REFUNDED,
          PaymentStatus.PARTIALLY_REFUNDED,
        ],
      })
      .getRawOne();

    return {
      totalPaid: parseFloat(result.totalPaid) || 0,
      totalRefunded: parseFloat(result.totalRefunded) || 0,
      count: parseInt(result.count, 10) || 0,
    };
  }

  async handleWebhook(
    gateway: string,
    payload: Record<string, any>,
  ): Promise<{ received: boolean }> {
    this.logger.log(
      `Webhook received from ${gateway}: ${JSON.stringify(payload)}`,
    );

    const transactionId =
      payload.transactionId ||
      payload.orderId ||
      payload.paymentId;

    if (!transactionId) {
      this.logger.warn(`Webhook from ${gateway}: no transaction ID found`);
      return { received: true };
    }

    const payment = await this.paymentRepository.findOne({
      where: { gatewayTransactionId: transactionId },
    });

    if (!payment) {
      this.logger.warn(
        `Webhook from ${gateway}: no payment found for transactionId=${transactionId}`,
      );
      return { received: true };
    }

    const status = payload.status || payload.orderStatus;

    if (status === 'completed' || status === 'Succeeded' || status === 2) {
      payment.status = PaymentStatus.COMPLETED;
    } else if (status === 'failed' || status === 'Failed') {
      payment.status = PaymentStatus.FAILED;
    }

    payment.gatewayResponse = payload;
    await this.paymentRepository.save(payment);

    this.logger.log(
      `Webhook processed for payment ${payment.id}: status=${payment.status}`,
    );

    return { received: true };
  }
}
