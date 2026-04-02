'use client';

import { useState, useActionState } from 'react';
import Link from 'next/link';
import { Mail, KeyRound, Send, ArrowLeft } from 'lucide-react';
import { sendOtp, verifyOtp } from '@/actions/auth.actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { appConfig } from '@/config/app.config';
import type { ActionResponse } from '@/types/api';

const initialState: ActionResponse = { success: false };

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [sendState, sendAction, isSending] = useActionState(
    async (prevState: ActionResponse, formData: FormData) => {
      const result = await sendOtp(prevState, formData);
      if (result.success) {
        setEmail(formData.get('email') as string);
        setOtpSent(true);
      }
      return result;
    },
    initialState
  );

  const [verifyState, verifyAction, isVerifying] = useActionState(verifyOtp, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">{appConfig.name}</h1>
          <p className="mt-2 text-gray-600">
            {otpSent ? 'Ingresá el código que recibiste' : 'Iniciá sesión en tu cuenta'}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          {!otpSent ? (
            <form action={sendAction} className="space-y-5">
              {sendState.error && <Alert type="error" message={sendState.error} />}
              <div className="relative">
                <Mail className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="tu@email.com"
                  className="pl-9"
                />
              </div>
              <Button type="submit" loading={isSending} className="w-full" size="lg">
                <Send className="h-4 w-4 mr-2" />
                Enviar código
              </Button>
            </form>
          ) : (
            <form action={verifyAction} className="space-y-5">
              {verifyState.error && <Alert type="error" message={verifyState.error} />}
              <input type="hidden" name="email" value={email} />
              <p className="text-sm text-gray-600 text-center">
                Enviamos un código a <span className="font-medium">{email}</span>
              </p>
              <div className="relative">
                <KeyRound className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
                <Input
                  label="Código"
                  name="token"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  placeholder="Ingresá el código"
                  className="pl-9"
                />
              </div>
              <Button type="submit" loading={isVerifying} className="w-full" size="lg">
                Verificar
              </Button>
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="flex items-center justify-center gap-1.5 w-full text-sm text-gray-500 hover:text-gray-700 min-h-[44px]"
              >
                <ArrowLeft className="h-4 w-4" />
                Cambiar email
              </button>
            </form>
          )}
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
