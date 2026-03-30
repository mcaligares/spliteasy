import type { Balance } from '@/entities/balance.entity';
import type { DbClient } from './types';
import { logger } from '@/lib/logger';

export interface UpsertBalanceData {
  group_id: string;
  from_user: string;
  to_user: string;
  amount: number;
}

export function createBalanceRepository(db: DbClient) {
  return {
    async upsert(data: UpsertBalanceData): Promise<Balance> {
      logger.repo('BalanceRepository.upsert', 'Executing upsert', {
        table: 'balances',
        data: { group_id: data.group_id, from_user: data.from_user, to_user: data.to_user },
      });
      const start = performance.now();
      const { data: balance, error } = await db
        .from('balances')
        .upsert(data, { onConflict: 'group_id,from_user,to_user' })
        .select()
        .single();
      const duration = (performance.now() - start).toFixed(2);
      logger.repo('BalanceRepository.upsert', `Query completed in ${duration}ms`, { success: !error });
      if (error) throw error;
      return balance as Balance;
    },

    async findByGroupId(groupId: string): Promise<Balance[]> {
      logger.repo('BalanceRepository.findByGroupId', 'Executing query', { table: 'balances', groupId });
      const start = performance.now();
      const { data, error } = await db
        .from('balances')
        .select('*')
        .eq('group_id', groupId)
        .neq('amount', 0);
      const duration = (performance.now() - start).toFixed(2);
      logger.repo('BalanceRepository.findByGroupId', `Query completed in ${duration}ms`, { rows: data?.length });
      if (error) throw error;
      return (data ?? []) as Balance[];
    },

    async findAllByGroupId(groupId: string): Promise<Balance[]> {
      logger.repo('BalanceRepository.findAllByGroupId', 'Executing query', { table: 'balances', groupId });
      const start = performance.now();
      const { data, error } = await db
        .from('balances')
        .select('*')
        .eq('group_id', groupId);
      const duration = (performance.now() - start).toFixed(2);
      logger.repo('BalanceRepository.findAllByGroupId', `Query completed in ${duration}ms`, { rows: data?.length });
      if (error) throw error;
      return (data ?? []) as Balance[];
    },

    async deleteByGroupId(groupId: string): Promise<void> {
      logger.repo('BalanceRepository.deleteByGroupId', 'Executing delete', { groupId });
      const start = performance.now();
      const { error } = await db.from('balances').delete().eq('group_id', groupId);
      const duration = (performance.now() - start).toFixed(2);
      logger.repo('BalanceRepository.deleteByGroupId', `Query completed in ${duration}ms`, { success: !error });
      if (error) throw error;
    },
  };
}
