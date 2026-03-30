'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signUp } from '@/actions/auth.actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { appConfig } from '@/config/app.config';
import type { ActionResponse } from '@/types/api';

const initialState: ActionResponse = { success: false };

export default function RegisterPage() {
  const [state, action, isPending] = useActionState(signUp, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">{appConfig.name}</h1>
          <p className="mt-2 text-gray-600">Creá tu cuenta</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form action={action} className="space-y-5">
            {state.error && <Alert type="error" message={state.error} />}
            <Input
              label="Nombre"
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder="Juan Pérez"
            />
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
              autoComplete="new-password"
              required
              placeholder="Mínimo 6 caracteres"
              minLength={6}
            />
            <Button type="submit" loading={isPending} className="w-full" size="lg">
              Crear cuenta
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
