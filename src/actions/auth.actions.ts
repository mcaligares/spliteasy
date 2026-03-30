'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAuthService } from '@/services/auth.service';
import { authConfig } from '@/config/auth.config';
import { logger } from '@/lib/logger';
import type { ActionResponse } from './types';

export async function signUp(
  _prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  logger.action('signUp', 'Started', { email: email?.split('@')[0] });

  if (!email || !password || !name) {
    return { success: false, error: 'Todos los campos son requeridos' };
  }

  try {
    const db = await createClient();
    const authService = createAuthService(db);
    await authService.signUp(email, password, name);
    logger.action('signUp', 'Success');
  } catch (error) {
    logger.error('signUp', 'Failed', { error: (error as Error).message });
    return { success: false, error: 'Error al registrar usuario. El email puede estar en uso.' };
  }

  redirect(authConfig.redirects.afterSignup);
}

export async function signIn(
  _prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  logger.action('signIn', 'Started', { email: email?.split('@')[0] });

  if (!email || !password) {
    return { success: false, error: 'Email y contraseña son requeridos' };
  }

  try {
    const db = await createClient();
    const authService = createAuthService(db);
    await authService.signIn(email, password);
    logger.action('signIn', 'Success');
  } catch (error) {
    logger.error('signIn', 'Failed', { error: (error as Error).message });
    return { success: false, error: 'Credenciales inválidas' };
  }

  redirect(authConfig.redirects.afterLogin);
}

export async function signOut(): Promise<void> {
  logger.action('signOut', 'Started');
  try {
    const db = await createClient();
    const authService = createAuthService(db);
    await authService.signOut();
    logger.action('signOut', 'Success');
  } catch (error) {
    logger.error('signOut', 'Failed', { error: (error as Error).message });
  }
  redirect(authConfig.redirects.afterLogout);
}
