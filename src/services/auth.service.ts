import type { DbClient } from '@/repositories/types';
import type { User } from '@/entities/user.entity';
import { logger } from '@/lib/logger';

export function createAuthService(db: DbClient) {
  return {
    async signUp(email: string, password: string, name: string): Promise<void> {
      logger.service('AuthService.signUp', 'Registering user');
      const { error } = await db.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) throw error;
    },

    async signIn(email: string, password: string): Promise<void> {
      logger.service('AuthService.signIn', 'Signing in user');
      const { error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },

    async signOut(): Promise<void> {
      logger.service('AuthService.signOut', 'Signing out user');
      const { error } = await db.auth.signOut();
      if (error) throw error;
    },

    async getCurrentUser(): Promise<User | null> {
      logger.service('AuthService.getCurrentUser', 'Getting current user');
      const { data: { user } } = await db.auth.getUser();
      if (!user) return null;

      const { data: profile } = await db
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      return profile as User | null;
    },
  };
}
