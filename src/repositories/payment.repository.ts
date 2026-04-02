import type { Payment } from '@/entities/payment.entity';
import type { DbClient } from './types';
import { logger } from '@/lib/logger';

const log = logger.repo('payment');

export interface InsertPaymentData {
  group_id: string;
  paid_by: string;
  paid_to: string;
  amount: number;
  note?: string;
}

export function createPaymentRepository(db: DbClient) {
  return {
    async insert(data: InsertPaymentData): Promise<Payment> {
      log('insert', 'Executing insert', {
        table: 'payments',
        data: { group_id: data.group_id, amount: data.amount },
      });
      const start = performance.now();
      const { data: payment, error } = await db.from('payments').insert(data).select().single();
      const duration = (performance.now() - start).toFixed(2);
      log('insert', `Query completed in ${duration}ms`, {
        success: !error,
        rowId: payment?.id,
      });
      if (error) throw error;
      return payment as Payment;
    },

    async findByGroupId(groupId: string): Promise<Payment[]> {
      log('findByGroupId', 'Executing query', { table: 'payments', groupId });
      const start = performance.now();
      const { data, error } = await db
        .from('payments')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });
      const duration = (performance.now() - start).toFixed(2);
      log('findByGroupId', `Query completed in ${duration}ms`, { rows: data?.length });
      if (error) throw error;
      return (data ?? []) as Payment[];
    },
  };
}
