import type { ExpenseParticipant } from '@/entities/expense-participant.entity';
import type { DbClient } from './types';
import { logger } from '@/lib/logger';

const log = logger.repo('expenseParticipant');

export interface InsertParticipantData {
  expense_id: string;
  user_id: string;
  amount_owed: number;
}

export function createExpenseParticipantRepository(db: DbClient) {
  return {
    async insertMany(data: InsertParticipantData[]): Promise<ExpenseParticipant[]> {
      log('insertMany', 'Executing insert', {
        table: 'expense_participants',
        count: data.length,
      });
      const start = performance.now();
      const { data: participants, error } = await db
        .from('expense_participants')
        .insert(data)
        .select();
      const duration = (performance.now() - start).toFixed(2);
      log('insertMany', `Query completed in ${duration}ms`, {
        success: !error,
        rows: participants?.length,
      });
      if (error) throw error;
      return (participants ?? []) as ExpenseParticipant[];
    },

    async findByExpenseId(expenseId: string): Promise<ExpenseParticipant[]> {
      log('findByExpenseId', 'Executing query', { expenseId });
      const start = performance.now();
      const { data, error } = await db
        .from('expense_participants')
        .select('*')
        .eq('expense_id', expenseId);
      const duration = (performance.now() - start).toFixed(2);
      log('findByExpenseId', `Query completed in ${duration}ms`, { rows: data?.length });
      if (error) throw error;
      return (data ?? []) as ExpenseParticipant[];
    },

    async findByGroupExpenses(groupId: string): Promise<(ExpenseParticipant & { expenses: { group_id: string; paid_by: string } })[]> {
      log('findByGroupExpenses', 'Executing query', { groupId });
      const start = performance.now();
      const { data, error } = await db
        .from('expense_participants')
        .select('*, expenses!inner(group_id, paid_by, amount)')
        .eq('expenses.group_id', groupId);
      const duration = (performance.now() - start).toFixed(2);
      log('findByGroupExpenses', `Query completed in ${duration}ms`, { rows: data?.length });
      if (error) throw error;
      return (data ?? []) as (ExpenseParticipant & { expenses: { group_id: string; paid_by: string } })[];
    },
  };
}
