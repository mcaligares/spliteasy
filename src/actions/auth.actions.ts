'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAuthService } from '@/services/auth.service';
import { authConfig } from '@/config/auth.config';
import { logger } from '@/lib/logger';
import type { ActionResponse } from './types';

const log = logger.action('auth');

export async function sendOtp(
  _prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const email = formData.get('email') as string;
  const name = formData.get('name') as string | null;

  log('sendOtp', 'Started', { email: email?.split('@')[0] });

  if (!email) {
    return { success: false, error: 'El email es requerido' };
  }

  try {
    const db = await createClient();
    const authService = createAuthService(db);
    await authService.sendOtp(email, name ? { name } : undefined);
    log('sendOtp', 'Success');
    return { success: true };
  } catch (error) {
    log.error('sendOtp', 'Failed', { error: (error as Error).message });
    return { success: false, error: 'Error al enviar el código. Intentá de nuevo.' };
  }
}

export async function verifyOtp(
  _prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const email = formData.get('email') as string;
  const token = formData.get('token') as string;

  log('verifyOtp', 'Started', { email: email?.split('@')[0] });

  if (!email || !token) {
    return { success: false, error: 'El email y el código son requeridos' };
  }

  try {
    const db = await createClient();
    const authService = createAuthService(db);
    await authService.verifyOtp(email, token);
    log('verifyOtp', 'Success');
  } catch (error) {
    log.error('verifyOtp', 'Failed', { error: (error as Error).message });
    return { success: false, error: 'Código inválido o expirado' };
  }

  redirect(authConfig.redirects.afterLogin);
}

export async function signOut(): Promise<void> {
  log('signOut', 'Started');
  try {
    const db = await createClient();
    const authService = createAuthService(db);
    await authService.signOut();
    log('signOut', 'Success');
  } catch (error) {
    log.error('signOut', 'Failed', { error: (error as Error).message });
  }
  redirect(authConfig.redirects.afterLogout);
}
