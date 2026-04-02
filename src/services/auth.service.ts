import type { DbClient } from '@/repositories/types';
import type { User } from '@/entities/user.entity';
import { logger } from '@/lib/logger';

const log = logger.service('auth');

export function createAuthService(db: DbClient) {
  return {
    async sendOtp(email: string, metadata?: { name: string }): Promise<void> {
      log('sendOtp', 'Sending OTP', { email: email.split('@')[0] });
      const { error } = await db.auth.signInWithOtp({
        email,
        options: metadata ? { data: metadata } : undefined,
      });
      if (error) throw error;
    },

    async verifyOtp(email: string, token: string): Promise<void> {
      log('verifyOtp', 'Verifying OTP', { email: email.split('@')[0] });
      const { error } = await db.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      if (error) throw error;
    },

    async signOut(): Promise<void> {
      log('signOut', 'Signing out user');
      const { error } = await db.auth.signOut();
      if (error) throw error;
    },

    async getCurrentUser(): Promise<User | null> {
      log('getCurrentUser', 'Getting current user');
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
