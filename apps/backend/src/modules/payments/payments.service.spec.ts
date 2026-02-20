import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PaymentsService } from './payments.service';
import {
  Payment,
  PaymentStatus,
  PaymentMethod,
  PaymentGateway,
} from '@/common/database/entities/payment.entity';
import { GatewayFactory } from './gateways/gateway-factory';
import {
  IPaymentGateway,
  PaymentGatewayResult,
  RefundResult,
} from './gateways/payment-gateway.interface';

// ── Helper: build a mock Payment ─────────────────────────────────────
function mockPayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 'payment-uuid-1',
    userId: 'user-uuid-1',
    user: {} as any,
    companyId: null,
    amount: 100,
    currency: 'GEL',
    paymentMethod: PaymentMethod.BOG_CARD,
    paymentGateway: PaymentGateway.MOCK,
    status: PaymentStatus.PENDING,
    gatewayTransactionId: null,
    gatewayResponse: null,
    description: 'Test payment',
    refundAmount: 0,
    refundedAt: null,
    taxAmount: 18,
    taxRate: 18,
    metadata: null,
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
    deletedAt: null,
    ...overrides,
  } as Payment;
}

// ── Mock gateway ─────────────────────────────────────────────────────
function createMockGateway(): jest.Mocked<IPaymentGateway> {
  return {
    initializePayment: jest.fn(),
    confirmPayment: jest.fn(),
    processRefund: jest.fn(),
    getTransactionStatus: jest.fn(),
  };
}

// ── QueryBuilder mock ────────────────────────────────────────────────
function createQueryBuilderMock(overrides: Record<string, any> = {}) {
  const qb: Record<string, jest.Mock> = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getRawOne: jest.fn().mockResolvedValue({}),
    ...overrides,
  };
  return qb;
}

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentRepo: Record<string, jest.Mock>;
  let gatewayFactory: { getGateway: jest.Mock };
  let mockGateway: jest.Mocked<IPaymentGateway>;
  let qb: ReturnType<typeof createQueryBuilderMock>;

  beforeEach(async () => {
    mockGateway = createMockGateway();
    qb = createQueryBuilderMock();

    paymentRepo = {
      create: jest.fn().mockImplementation((data) => ({ id: 'payment-uuid-1', ...data })),
      save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    gatewayFactory = {
      getGateway: jest.fn().mockReturnValue(mockGateway),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Payment), useValue: paymentRepo },
        { provide: GatewayFactory, useValue: gatewayFactory },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────
  // createPayment
  // ─────────────────────────────────────────────────────────────────
  describe('createPayment', () => {
    const createDto = {
      amount: 100,
      currency: 'GEL',
      paymentMethod: PaymentMethod.BOG_CARD,
      paymentGateway: PaymentGateway.MOCK,
      description: 'Booking payment',
    };

    it('should create a payment and initialize the gateway', async () => {
      const gatewayResult: PaymentGatewayResult = {
        success: true,
        transactionId: 'txn-123',
        status: 'completed',
        gatewayResponse: { code: 'OK' },
      };
      mockGateway.initializePayment.mockResolvedValue(gatewayResult);

      const result = await service.createPayment('user-uuid-1', createDto as any);

      expect(paymentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-uuid-1',
          amount: 100,
          currency: 'GEL',
          paymentMethod: PaymentMethod.BOG_CARD,
          paymentGateway: PaymentGateway.MOCK,
          status: PaymentStatus.PENDING,
          taxRate: 18,
          refundAmount: 0,
        }),
      );
      expect(gatewayFactory.getGateway).toHaveBeenCalledWith(PaymentGateway.MOCK);
      expect(mockGateway.initializePayment).toHaveBeenCalledWith({
        amount: 100,
        currency: 'GEL',
        orderId: 'payment-uuid-1',
        description: 'Booking payment',
      });
      expect(result.payment).toBeDefined();
      expect(result.payment.status).toBe(PaymentStatus.COMPLETED);
      expect(result.payment.gatewayTransactionId).toBe('txn-123');
    });

    it('should calculate tax amount correctly with default 18% rate', async () => {
      mockGateway.initializePayment.mockResolvedValue({
        success: true,
        transactionId: 'txn-1',
        status: 'completed',
        gatewayResponse: {},
      });

      await service.createPayment('user-uuid-1', createDto as any);

      expect(paymentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          taxRate: 18,
          taxAmount: 18.00, // 100 * 18 / 100
        }),
      );
    });

    it('should use custom tax rate when provided', async () => {
      mockGateway.initializePayment.mockResolvedValue({
        success: true,
        transactionId: 'txn-1',
        status: 'completed',
        gatewayResponse: {},
      });

      await service.createPayment('user-uuid-1', {
        ...createDto,
        taxRate: 10,
      } as any);

      expect(paymentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          taxRate: 10,
          taxAmount: 10.00, // 100 * 10 / 100
        }),
      );
    });

    it('should set status to PROCESSING when gateway returns pending', async () => {
      mockGateway.initializePayment.mockResolvedValue({
        success: true,
        transactionId: 'txn-2',
        status: 'pending',
        gatewayResponse: { message: 'Waiting for confirmation' },
      });

      const result = await service.createPayment('user-uuid-1', createDto as any);

      expect(result.payment.status).toBe(PaymentStatus.PROCESSING);
    });

    it('should set status to FAILED when gateway fails', async () => {
      mockGateway.initializePayment.mockResolvedValue({
        success: false,
        transactionId: 'txn-fail',
        status: 'failed',
        gatewayResponse: { error: 'Card declined' },
      });

      const result = await service.createPayment('user-uuid-1', createDto as any);

      expect(result.payment.status).toBe(PaymentStatus.FAILED);
      expect(result.payment.gatewayTransactionId).toBe('txn-fail');
    });

    it('should include redirectUrl in response when gateway provides one', async () => {
      mockGateway.initializePayment.mockResolvedValue({
        success: true,
        transactionId: 'txn-3',
        status: 'pending',
        gatewayResponse: {},
        redirectUrl: 'https://gateway.example.com/pay/txn-3',
      });

      const result = await service.createPayment('user-uuid-1', createDto as any);

      expect(result.redirectUrl).toBe('https://gateway.example.com/pay/txn-3');
    });

    it('should not include redirectUrl when not provided by gateway', async () => {
      mockGateway.initializePayment.mockResolvedValue({
        success: true,
        transactionId: 'txn-4',
        status: 'completed',
        gatewayResponse: {},
      });

      const result = await service.createPayment('user-uuid-1', createDto as any);

      expect(result.redirectUrl).toBeUndefined();
    });

    it('should default currency to GEL when not provided', async () => {
      mockGateway.initializePayment.mockResolvedValue({
        success: true,
        transactionId: 'txn-5',
        status: 'completed',
        gatewayResponse: {},
      });

      await service.createPayment('user-uuid-1', {
        ...createDto,
        currency: undefined,
      } as any);

      expect(paymentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ currency: 'GEL' }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // confirmPayment
  // ─────────────────────────────────────────────────────────────────
  describe('confirmPayment', () => {
    it('should confirm a PENDING payment successfully', async () => {
      const payment = mockPayment({
        status: PaymentStatus.PENDING,
        gatewayTransactionId: 'txn-100',
      });
      paymentRepo.findOne.mockResolvedValue(payment);
      mockGateway.confirmPayment.mockResolvedValue({
        success: true,
        transactionId: 'txn-100',
        status: 'completed',
        gatewayResponse: { confirmed: true },
      });

      const result = await service.confirmPayment('payment-uuid-1');

      expect(mockGateway.confirmPayment).toHaveBeenCalledWith('txn-100');
      expect(result.status).toBe(PaymentStatus.COMPLETED);
    });

    it('should confirm a PROCESSING payment successfully', async () => {
      const payment = mockPayment({
        status: PaymentStatus.PROCESSING,
        gatewayTransactionId: 'txn-101',
      });
      paymentRepo.findOne.mockResolvedValue(payment);
      mockGateway.confirmPayment.mockResolvedValue({
        success: true,
        transactionId: 'txn-101',
        status: 'completed',
        gatewayResponse: {},
      });

      const result = await service.confirmPayment('payment-uuid-1');

      expect(result.status).toBe(PaymentStatus.COMPLETED);
    });

    it('should set status to FAILED when gateway confirmation fails', async () => {
      const payment = mockPayment({
        status: PaymentStatus.PENDING,
        gatewayTransactionId: 'txn-102',
      });
      paymentRepo.findOne.mockResolvedValue(payment);
      mockGateway.confirmPayment.mockResolvedValue({
        success: false,
        transactionId: 'txn-102',
        status: 'failed',
        gatewayResponse: { error: 'timeout' },
      });

      const result = await service.confirmPayment('payment-uuid-1');

      expect(result.status).toBe(PaymentStatus.FAILED);
    });

    it('should throw BadRequestException if payment is not PENDING/PROCESSING', async () => {
      const payment = mockPayment({ status: PaymentStatus.COMPLETED });
      paymentRepo.findOne.mockResolvedValue(payment);

      await expect(service.confirmPayment('payment-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for FAILED payments', async () => {
      const payment = mockPayment({ status: PaymentStatus.FAILED });
      paymentRepo.findOne.mockResolvedValue(payment);

      await expect(service.confirmPayment('payment-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should use payment.id if gatewayTransactionId is null', async () => {
      const payment = mockPayment({
        status: PaymentStatus.PENDING,
        gatewayTransactionId: null,
      });
      paymentRepo.findOne.mockResolvedValue(payment);
      mockGateway.confirmPayment.mockResolvedValue({
        success: true,
        transactionId: 'payment-uuid-1',
        status: 'completed',
        gatewayResponse: {},
      });

      await service.confirmPayment('payment-uuid-1');

      expect(mockGateway.confirmPayment).toHaveBeenCalledWith('payment-uuid-1');
    });

    it('should throw NotFoundException if payment not found', async () => {
      paymentRepo.findOne.mockResolvedValue(null);

      await expect(service.confirmPayment('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // processRefund
  // ─────────────────────────────────────────────────────────────────
  describe('processRefund', () => {
    const refundDto = { amount: 50, reason: 'Customer request' };

    it('should process a partial refund on a COMPLETED payment', async () => {
      const payment = mockPayment({
        status: PaymentStatus.COMPLETED,
        amount: 100,
        refundAmount: 0,
        gatewayTransactionId: 'txn-200',
      });
      paymentRepo.findOne.mockResolvedValue(payment);
      mockGateway.processRefund.mockResolvedValue({
        success: true,
        transactionId: 'refund-1',
        refundedAmount: 50,
        gatewayResponse: { refunded: true },
      });

      const result = await service.processRefund('payment-uuid-1', refundDto as any, 'admin-1');

      expect(mockGateway.processRefund).toHaveBeenCalledWith({
        transactionId: 'txn-200',
        amount: 50,
        reason: 'Customer request',
      });
      expect(result.refundAmount).toBe(50);
      expect(result.status).toBe(PaymentStatus.PARTIALLY_REFUNDED);
      expect(result.refundedAt).toBeInstanceOf(Date);
    });

    it('should set status to REFUNDED when full amount is refunded', async () => {
      const payment = mockPayment({
        status: PaymentStatus.COMPLETED,
        amount: 100,
        refundAmount: 0,
        gatewayTransactionId: 'txn-201',
      });
      paymentRepo.findOne.mockResolvedValue(payment);
      mockGateway.processRefund.mockResolvedValue({
        success: true,
        transactionId: 'refund-2',
        refundedAmount: 100,
        gatewayResponse: {},
      });

      const result = await service.processRefund(
        'payment-uuid-1',
        { amount: 100, reason: 'Full refund' } as any,
        'admin-1',
      );

      expect(result.refundAmount).toBe(100);
      expect(result.status).toBe(PaymentStatus.REFUNDED);
    });

    it('should allow further refund on PARTIALLY_REFUNDED payment', async () => {
      const payment = mockPayment({
        status: PaymentStatus.PARTIALLY_REFUNDED,
        amount: 100,
        refundAmount: 30,
        gatewayTransactionId: 'txn-202',
      });
      paymentRepo.findOne.mockResolvedValue(payment);
      mockGateway.processRefund.mockResolvedValue({
        success: true,
        transactionId: 'refund-3',
        refundedAmount: 70,
        gatewayResponse: {},
      });

      const result = await service.processRefund(
        'payment-uuid-1',
        { amount: 70 } as any,
        'admin-1',
      );

      expect(result.refundAmount).toBe(100); // 30 + 70
      expect(result.status).toBe(PaymentStatus.REFUNDED);
    });

    it('should throw BadRequestException when refund exceeds maximum refundable', async () => {
      const payment = mockPayment({
        status: PaymentStatus.COMPLETED,
        amount: 100,
        refundAmount: 80,
      });
      paymentRepo.findOne.mockResolvedValue(payment);

      await expect(
        service.processRefund('payment-uuid-1', { amount: 30 } as any, 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for PENDING payment', async () => {
      const payment = mockPayment({ status: PaymentStatus.PENDING });
      paymentRepo.findOne.mockResolvedValue(payment);

      await expect(
        service.processRefund('payment-uuid-1', refundDto as any, 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for FAILED payment', async () => {
      const payment = mockPayment({ status: PaymentStatus.FAILED });
      paymentRepo.findOne.mockResolvedValue(payment);

      await expect(
        service.processRefund('payment-uuid-1', refundDto as any, 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when gateway refund fails', async () => {
      const payment = mockPayment({
        status: PaymentStatus.COMPLETED,
        amount: 100,
        refundAmount: 0,
        gatewayTransactionId: 'txn-203',
      });
      paymentRepo.findOne.mockResolvedValue(payment);
      mockGateway.processRefund.mockResolvedValue({
        success: false,
        transactionId: 'refund-fail',
        refundedAmount: 0,
        gatewayResponse: { error: 'Refund declined' },
      });

      await expect(
        service.processRefund('payment-uuid-1', refundDto as any, 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if payment not found', async () => {
      paymentRepo.findOne.mockResolvedValue(null);

      await expect(
        service.processRefund('nonexistent', refundDto as any, 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // findById
  // ─────────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('should return payment when found', async () => {
      const payment = mockPayment();
      paymentRepo.findOne.mockResolvedValue(payment);

      const result = await service.findById('payment-uuid-1');

      expect(result).toEqual(payment);
      expect(paymentRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'payment-uuid-1' },
      });
    });

    it('should throw NotFoundException when not found', async () => {
      paymentRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // findAll
  // ─────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return paginated results', async () => {
      const payments = [mockPayment()];
      qb.getManyAndCount.mockResolvedValue([payments, 1]);

      const result = await service.findAll({ page: 1, limit: 20 } as any);

      expect(result.data).toEqual(payments);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should apply all filters', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({
        userId: 'user-1',
        status: PaymentStatus.COMPLETED,
        paymentMethod: PaymentMethod.BOG_CARD,
        paymentGateway: PaymentGateway.MOCK,
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31',
        page: 2,
        limit: 10,
      } as any);

      expect(qb.andWhere).toHaveBeenCalledTimes(6);
      expect(qb.skip).toHaveBeenCalledWith(10); // (2-1) * 10
      expect(qb.take).toHaveBeenCalledWith(10);
    });

    it('should use default pagination values', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({} as any);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // findByUser
  // ─────────────────────────────────────────────────────────────────
  describe('findByUser', () => {
    it('should return payments for user ordered by createdAt DESC', async () => {
      const payments = [mockPayment(), mockPayment({ id: 'payment-2' })];
      paymentRepo.find.mockResolvedValue(payments);

      const result = await service.findByUser('user-uuid-1');

      expect(paymentRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(payments);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // getPaymentSummary
  // ─────────────────────────────────────────────────────────────────
  describe('getPaymentSummary', () => {
    it('should return aggregated payment summary', async () => {
      qb.getRawOne.mockResolvedValue({
        totalPaid: '500.00',
        totalRefunded: '100.00',
        count: '5',
      });

      const result = await service.getPaymentSummary('user-uuid-1');

      expect(result).toEqual({
        totalPaid: 500,
        totalRefunded: 100,
        count: 5,
      });
    });

    it('should handle null values gracefully', async () => {
      qb.getRawOne.mockResolvedValue({
        totalPaid: null,
        totalRefunded: null,
        count: null,
      });

      const result = await service.getPaymentSummary('user-uuid-1');

      expect(result).toEqual({
        totalPaid: 0,
        totalRefunded: 0,
        count: 0,
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // handleWebhook
  // ─────────────────────────────────────────────────────────────────
  describe('handleWebhook', () => {
    it('should update payment to COMPLETED on success webhook', async () => {
      const payment = mockPayment({
        status: PaymentStatus.PROCESSING,
        gatewayTransactionId: 'txn-wh-1',
      });
      paymentRepo.findOne.mockResolvedValue(payment);

      const result = await service.handleWebhook('bog_ipay', {
        transactionId: 'txn-wh-1',
        status: 'completed',
      });

      expect(result).toEqual({ received: true });
      expect(payment.status).toBe(PaymentStatus.COMPLETED);
      expect(paymentRepo.save).toHaveBeenCalledWith(payment);
    });

    it('should update payment to FAILED on failure webhook', async () => {
      const payment = mockPayment({
        status: PaymentStatus.PROCESSING,
        gatewayTransactionId: 'txn-wh-2',
      });
      paymentRepo.findOne.mockResolvedValue(payment);

      await service.handleWebhook('bog_ipay', {
        transactionId: 'txn-wh-2',
        status: 'failed',
      });

      expect(payment.status).toBe(PaymentStatus.FAILED);
    });

    it('should handle TBC-style webhook with "Succeeded" status', async () => {
      const payment = mockPayment({
        status: PaymentStatus.PROCESSING,
        gatewayTransactionId: 'txn-wh-3',
      });
      paymentRepo.findOne.mockResolvedValue(payment);

      await service.handleWebhook('tbc_tpay', {
        transactionId: 'txn-wh-3',
        status: 'Succeeded',
      });

      expect(payment.status).toBe(PaymentStatus.COMPLETED);
    });

    it('should handle numeric status code (2 = success)', async () => {
      const payment = mockPayment({
        status: PaymentStatus.PROCESSING,
        gatewayTransactionId: 'txn-wh-4',
      });
      paymentRepo.findOne.mockResolvedValue(payment);

      await service.handleWebhook('bog_ipay', {
        transactionId: 'txn-wh-4',
        status: 2,
      });

      expect(payment.status).toBe(PaymentStatus.COMPLETED);
    });

    it('should handle "Failed" status string', async () => {
      const payment = mockPayment({
        status: PaymentStatus.PROCESSING,
        gatewayTransactionId: 'txn-wh-5',
      });
      paymentRepo.findOne.mockResolvedValue(payment);

      await service.handleWebhook('tbc_tpay', {
        transactionId: 'txn-wh-5',
        status: 'Failed',
      });

      expect(payment.status).toBe(PaymentStatus.FAILED);
    });

    it('should return received: true even if no transactionId in payload', async () => {
      const result = await service.handleWebhook('mock', { someField: 'value' });

      expect(result).toEqual({ received: true });
      expect(paymentRepo.findOne).not.toHaveBeenCalled();
    });

    it('should return received: true even if payment not found', async () => {
      paymentRepo.findOne.mockResolvedValue(null);

      const result = await service.handleWebhook('mock', {
        transactionId: 'unknown-txn',
      });

      expect(result).toEqual({ received: true });
      expect(paymentRepo.save).not.toHaveBeenCalled();
    });

    it('should look up payment by orderId when transactionId is absent', async () => {
      const payment = mockPayment({
        status: PaymentStatus.PROCESSING,
        gatewayTransactionId: 'order-1',
      });
      paymentRepo.findOne.mockResolvedValue(payment);

      await service.handleWebhook('mock', {
        orderId: 'order-1',
        status: 'completed',
      });

      expect(paymentRepo.findOne).toHaveBeenCalledWith({
        where: { gatewayTransactionId: 'order-1' },
      });
      expect(payment.status).toBe(PaymentStatus.COMPLETED);
    });

    it('should look up payment by paymentId when transactionId and orderId are absent', async () => {
      const payment = mockPayment({
        status: PaymentStatus.PROCESSING,
        gatewayTransactionId: 'pid-1',
      });
      paymentRepo.findOne.mockResolvedValue(payment);

      await service.handleWebhook('mock', {
        paymentId: 'pid-1',
        status: 'completed',
      });

      expect(paymentRepo.findOne).toHaveBeenCalledWith({
        where: { gatewayTransactionId: 'pid-1' },
      });
    });

    it('should store the full webhook payload in gatewayResponse', async () => {
      const payment = mockPayment({
        status: PaymentStatus.PROCESSING,
        gatewayTransactionId: 'txn-wh-store',
      });
      paymentRepo.findOne.mockResolvedValue(payment);

      const payload = {
        transactionId: 'txn-wh-store',
        status: 'completed',
        extra: 'data',
      };
      await service.handleWebhook('mock', payload);

      expect(payment.gatewayResponse).toEqual(payload);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Payment status transitions
  // ─────────────────────────────────────────────────────────────────
  describe('payment status transitions', () => {
    it('PENDING -> COMPLETED (via createPayment with success)', async () => {
      mockGateway.initializePayment.mockResolvedValue({
        success: true,
        transactionId: 'txn-st-1',
        status: 'completed',
        gatewayResponse: {},
      });

      const result = await service.createPayment('user-1', {
        amount: 50,
        paymentGateway: PaymentGateway.MOCK,
        paymentMethod: PaymentMethod.BOG_CARD,
      } as any);

      expect(result.payment.status).toBe(PaymentStatus.COMPLETED);
    });

    it('PENDING -> PROCESSING (via createPayment with pending status)', async () => {
      mockGateway.initializePayment.mockResolvedValue({
        success: true,
        transactionId: 'txn-st-2',
        status: 'pending',
        gatewayResponse: {},
      });

      const result = await service.createPayment('user-1', {
        amount: 50,
        paymentGateway: PaymentGateway.MOCK,
        paymentMethod: PaymentMethod.BOG_CARD,
      } as any);

      expect(result.payment.status).toBe(PaymentStatus.PROCESSING);
    });

    it('PENDING -> FAILED (via createPayment with failure)', async () => {
      mockGateway.initializePayment.mockResolvedValue({
        success: false,
        transactionId: 'txn-st-3',
        status: 'failed',
        gatewayResponse: {},
      });

      const result = await service.createPayment('user-1', {
        amount: 50,
        paymentGateway: PaymentGateway.MOCK,
        paymentMethod: PaymentMethod.BOG_CARD,
      } as any);

      expect(result.payment.status).toBe(PaymentStatus.FAILED);
    });

    it('COMPLETED -> PARTIALLY_REFUNDED (via processRefund partial)', async () => {
      const payment = mockPayment({
        status: PaymentStatus.COMPLETED,
        amount: 100,
        refundAmount: 0,
        gatewayTransactionId: 'txn-st-4',
      });
      paymentRepo.findOne.mockResolvedValue(payment);
      mockGateway.processRefund.mockResolvedValue({
        success: true,
        transactionId: 'r-1',
        refundedAmount: 30,
        gatewayResponse: {},
      });

      const result = await service.processRefund(
        'payment-uuid-1',
        { amount: 30 } as any,
        'admin',
      );

      expect(result.status).toBe(PaymentStatus.PARTIALLY_REFUNDED);
    });

    it('COMPLETED -> REFUNDED (via processRefund full)', async () => {
      const payment = mockPayment({
        status: PaymentStatus.COMPLETED,
        amount: 100,
        refundAmount: 0,
        gatewayTransactionId: 'txn-st-5',
      });
      paymentRepo.findOne.mockResolvedValue(payment);
      mockGateway.processRefund.mockResolvedValue({
        success: true,
        transactionId: 'r-2',
        refundedAmount: 100,
        gatewayResponse: {},
      });

      const result = await service.processRefund(
        'payment-uuid-1',
        { amount: 100 } as any,
        'admin',
      );

      expect(result.status).toBe(PaymentStatus.REFUNDED);
    });
  });
});
