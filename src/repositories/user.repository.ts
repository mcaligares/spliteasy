import type { User } from '@/entities/user.entity';
import type { DbClient } from './types';
import { logger } from '@/lib/logger';

const log = logger.repo('user');

export function createUserRepository(db: DbClient) {
  return {
    async findById(id: string): Promise<User | null> {
      log('findById', 'Executing query', { table: 'users', id });
      const start = performance.now();
      const { data, error } = await db.from('users').select('*').eq('id', id).single();
      const duration = (performance.now() - start).toFixed(2);
      log('findById', `Query completed in ${duration}ms`, { success: !error });
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as User;
    },

    async findByEmail(email: string): Promise<User | null> {
      log('findByEmail', 'Executing query', { table: 'users' });
      const start = performance.now();
      const { data, error } = await db.from('users').select('*').eq('email', email).single();
      const duration = (performance.now() - start).toFixed(2);
      log('findByEmail', `Query completed in ${duration}ms`, { success: !error });
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as User;
    },

    async findManyByIds(ids: string[]): Promise<User[]> {
      log('findManyByIds', 'Executing query', { table: 'users', count: ids.length });
      const start = performance.now();
      const { data, error } = await db.from('users').select('*').in('id', ids);
      const duration = (performance.now() - start).toFixed(2);
      log('findManyByIds', `Query completed in ${duration}ms`, { rows: data?.length });
      if (error) throw error;
      return (data ?? []) as User[];
    },
  };
}
