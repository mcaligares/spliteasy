import type { GroupMember, GroupMemberRole } from '@/entities/group-member.entity';
import type { DbClient } from './types';
import { logger } from '@/lib/logger';

const log = logger.repo('groupMember');

export interface InsertGroupMemberData {
  group_id: string;
  user_id: string;
  role: GroupMemberRole;
}

export function createGroupMemberRepository(db: DbClient) {
  return {
    async insert(data: InsertGroupMemberData): Promise<GroupMember> {
      log('insert', 'Executing insert', { table: 'group_members', groupId: data.group_id });
      const start = performance.now();
      const { data: member, error } = await db.from('group_members').insert(data).select().single();
      const duration = (performance.now() - start).toFixed(2);
      log('insert', `Query completed in ${duration}ms`, { success: !error });
      if (error) throw error;
      return member as GroupMember;
    },

    async findByGroupId(groupId: string): Promise<GroupMember[]> {
      log('findByGroupId', 'Executing query', { table: 'group_members', groupId });
      const start = performance.now();
      const { data, error } = await db.from('group_members').select('*').eq('group_id', groupId);
      const duration = (performance.now() - start).toFixed(2);
      log('findByGroupId', `Query completed in ${duration}ms`, { rows: data?.length });
      if (error) throw error;
      return (data ?? []) as GroupMember[];
    },

    async findByGroupAndUser(groupId: string, userId: string): Promise<GroupMember | null> {
      log('findByGroupAndUser', 'Executing query', { groupId, userId });
      const start = performance.now();
      const { data, error } = await db
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();
      const duration = (performance.now() - start).toFixed(2);
      log('findByGroupAndUser', `Query completed in ${duration}ms`, { success: !error });
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as GroupMember;
    },

    async delete(groupId: string, userId: string): Promise<void> {
      log('delete', 'Executing delete', { groupId, userId });
      const start = performance.now();
      const { error } = await db
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);
      const duration = (performance.now() - start).toFixed(2);
      log('delete', `Query completed in ${duration}ms`, { success: !error });
      if (error) throw error;
    },
  };
}
