import type { DbClient } from '@/repositories/types';
import { createPaymentRepository } from '@/repositories/payment.repository';
import { createActivityLogRepository } from '@/repositories/activity-log.repository';
import { createBalanceService } from './balance.service';
import type { Payment } from '@/entities/payment.entity';
import type { CreatePaymentInput } from '@/lib/validators/payment.schema';
import { logger } from '@/lib/logger';

export function createPaymentService(db: DbClient) {
  const paymentRepo = createPaymentRepository(db);
  const activityRepo = createActivityLogRepository(db);
  const balanceService = createBalanceService(db);

  return {
    async create(data: CreatePaymentInput, paidById: string): Promise<Payment> {
      logger.service('PaymentService.create', 'Validating payment', {
        groupId: data.group_id,
        amount: data.amount,
      });

      const userBalance = await balanceService.getUserBalance(data.group_id, paidById);
      const debtToPayee = userBalance.owes.find((o) => o.user.id === data.paid_to);

      if (!debtToPayee) {
        throw new Error('No tienes deuda con este usuario');
      }
      if (data.amount > debtToPayee.amount) {
        throw new Error(`El monto supera tu deuda actual de ${debtToPayee.amount}`);
      }

      logger.service('PaymentService.create', 'Validation passed, inserting payment');

      const payment = await paymentRepo.insert({
        group_id: data.group_id,
        paid_by: paidById,
        paid_to: data.paid_to,
        amount: data.amount,
        note: data.note,
      });

      await balanceService.recalculate(data.group_id);
      logger.service('PaymentService.create', 'Balances updated');

      await activityRepo.insert({
        group_id: data.group_id,
        user_id: paidById,
        action: 'payment_created',
        entity_type: 'payment',
        entity_id: payment.id,
        metadata: { amount: data.amount, paid_to: data.paid_to },
      });

      return payment;
    },

    async getByGroupId(groupId: string): Promise<Payment[]> {
      logger.service('PaymentService.getByGroupId', 'Fetching payments', { groupId });
      return paymentRepo.findByGroupId(groupId);
    },
  };
}
