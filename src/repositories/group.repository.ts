import type { Group } from '@/entities/group.entity';
import type { DbClient } from './types';
import { logger } from '@/lib/logger';

const log = logger.repo('group');

export interface InsertGroupData {
  name: string;
  description?: string;
  created_by: string;
}

export function createGroupRepository(db: DbClient) {
  return {
    async insert(data: InsertGroupData): Promise<Group> {
      log('insert', 'Executing insert', { table: 'groups', name: data.name });
      const start = performance.now();
      const { data: group, error } = await db.from('groups').insert(data).select().single();
      const duration = (performance.now() - start).toFixed(2);
      log('insert', `Query completed in ${duration}ms`, { success: !error, rowId: group?.id });
      if (error) throw error;
      return group as Group;
    },

    async findById(id: string): Promise<Group | null> {
      log('findById', 'Executing query', { table: 'groups', id });
      const start = performance.now();
      const { data, error } = await db.from('groups').select('*').eq('id', id).single();
      const duration = (performance.now() - start).toFixed(2);
      log('findById', `Query completed in ${duration}ms`, { success: !error });
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as Group;
    },

    async findAllForUser(userId: string): Promise<Group[]> {
      log('findAllForUser', 'Executing query', { table: 'groups', userId });
      const start = performance.now();
      const { data, error } = await db
        .from('groups')
        .select('*, group_members!inner(user_id)')
        .eq('group_members.user_id', userId);
      const duration = (performance.now() - start).toFixed(2);
      log('findAllForUser', `Query completed in ${duration}ms`, { rows: data?.length });
      if (error) throw error;
      return (data ?? []) as Group[];
    },
  };
}
