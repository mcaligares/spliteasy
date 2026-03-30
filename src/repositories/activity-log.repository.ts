import type { ActivityLog, ActivityAction } from '@/entities/activity-log.entity';
import type { DbClient } from './types';
import { logger } from '@/lib/logger';

export interface InsertActivityLogData {
  group_id: string;
  user_id: string;
  action: ActivityAction;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, unknown>;
}

export function createActivityLogRepository(db: DbClient) {
  return {
    async insert(data: InsertActivityLogData): Promise<ActivityLog> {
      logger.repo('ActivityLogRepository.insert', 'Executing insert', {
        table: 'activity_log',
        action: data.action,
      });
      const start = performance.now();
      const { data: log, error } = await db.from('activity_log').insert(data).select().single();
      const duration = (performance.now() - start).toFixed(2);
      logger.repo('ActivityLogRepository.insert', `Query completed in ${duration}ms`, { success: !error });
      if (error) throw error;
      return log as ActivityLog;
    },

    async findByGroupId(groupId: string, page = 1, limit = 20): Promise<ActivityLog[]> {
      logger.repo('ActivityLogRepository.findByGroupId', 'Executing query', { groupId, page, limit });
      const start = performance.now();
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const { data, error } = await db
        .from('activity_log')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .range(from, to);
      const duration = (performance.now() - start).toFixed(2);
      logger.repo('ActivityLogRepository.findByGroupId', `Query completed in ${duration}ms`, { rows: data?.length });
      if (error) throw error;
      return (data ?? []) as ActivityLog[];
    },
  };
}
