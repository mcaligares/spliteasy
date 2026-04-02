import type { Expense } from '@/entities/expense.entity';
import type { DbClient } from './types';
import { logger } from '@/lib/logger';

const log = logger.repo('expense');

export interface InsertExpenseData {
  group_id: string;
  description: string;
  amount: number;
  currency: string;
  paid_by: string;
  split_type: 'equal';
  created_by: string;
}

export function createExpenseRepository(db: DbClient) {
  return {
    async insert(data: InsertExpenseData): Promise<Expense> {
      log('insert', 'Executing insert', {
        table: 'expenses',
        data: { group_id: data.group_id, amount: data.amount, paid_by: data.paid_by },
      });
      const start = performance.now();
      const { data: expense, error } = await db.from('expenses').insert(data).select().single();
      const duration = (performance.now() - start).toFixed(2);
      log('insert', `Query completed in ${duration}ms`, {
        success: !error,
        rowId: expense?.id,
      });
      if (error) throw error;
      return expense as Expense;
    },

    async findById(id: string): Promise<Expense | null> {
      log('findById', 'Executing query', { table: 'expenses', id });
      const start = performance.now();
      const { data, error } = await db.from('expenses').select('*').eq('id', id).single();
      const duration = (performance.now() - start).toFixed(2);
      log('findById', `Query completed in ${duration}ms`, { success: !error });
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as Expense;
    },

    async findByGroupId(groupId: string): Promise<Expense[]> {
      log('findByGroupId', 'Executing query', { table: 'expenses', groupId });
      const start = performance.now();
      const { data, error } = await db
        .from('expenses')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });
      const duration = (performance.now() - start).toFixed(2);
      log('findByGroupId', `Query completed in ${duration}ms`, { rows: data?.length });
      if (error) throw error;
      return (data ?? []) as Expense[];
    },

    async delete(id: string): Promise<void> {
      log('delete', 'Executing delete', { table: 'expenses', id });
      const start = performance.now();
      const { error } = await db.from('expenses').delete().eq('id', id);
      const duration = (performance.now() - start).toFixed(2);
      log('delete', `Query completed in ${duration}ms`, { success: !error });
      if (error) throw error;
    },
  };
}
