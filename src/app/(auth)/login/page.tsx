'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signIn } from '@/actions/auth.actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { appConfig } from '@/config/app.config';
import type { ActionResponse } from '@/types/api';

const initialState: ActionResponse = { success: false };

export default function LoginPage() {
  const [state, action, isPending] = useActionState(signIn, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">{appConfig.name}</h1>
          <p className="mt-2 text-gray-600">Iniciá sesión en tu cuenta</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form action={action} className="space-y-5">
            {state.error && <Alert type="error" message={state.error} />}
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="tu@email.com"
            />
            <Input
              label="Contraseña"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
            <Button type="submit" loading={isPending} className="w-full" size="lg">
              Iniciar sesión
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            ¿No tenés cuenta?{' '}
            <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
