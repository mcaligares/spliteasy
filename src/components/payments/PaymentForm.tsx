'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { createPayment } from '@/actions/payment.actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import type { User } from '@/entities/user.entity';
import type { ActionResponse } from '@/types/api';
import type { Payment } from '@/entities/payment.entity';

interface Debt {
  user: User;
  amount: number;
}

interface PaymentFormProps {
  groupId: string;
  debts: Debt[];
  preselectedUserId?: string;
  preselectedAmount?: number;
}

const initialState: ActionResponse<Payment> = { success: false };

export function PaymentForm({ groupId, debts, preselectedUserId, preselectedAmount }: PaymentFormProps) {
  const [state, action, isPending] = useActionState(createPayment, initialState);

  if (debts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No tenés deudas pendientes en este grupo.</p>
        <Link href={`/groups/${groupId}`} className="text-indigo-600 text-sm mt-2 inline-block">
          Volver al grupo
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {state.error && <Alert type="error" message={state.error} />}
      <input type="hidden" name="group_id" value={groupId} />

      <div className="space-y-1">
        <label htmlFor="paid_to" className="block text-sm font-medium text-gray-700">
          Pagar a
        </label>
        <select
          id="paid_to"
          name="paid_to"
          defaultValue={preselectedUserId || ''}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Seleccionar persona</option>
          {debts.map(({ user, amount }) => (
            <option key={user.id} value={user.id}>
              {user.name} (debés ${amount.toFixed(2)})
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Monto"
        name="amount"
        type="number"
        required
        min="0.01"
        step="0.01"
        defaultValue={preselectedAmount?.toFixed(2)}
        placeholder="0.00"
      />

      <div className="space-y-1">
        <label htmlFor="note" className="block text-sm font-medium text-gray-700">
          Nota <span className="text-gray-400">(opcional)</span>
        </label>
        <input
          id="note"
          name="note"
          type="text"
          maxLength={200}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Transferencia, efectivo, etc."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Link href={`/groups/${groupId}`} className="flex-1">
          <Button variant="secondary" className="w-full">Cancelar</Button>
        </Link>
        <Button type="submit" loading={isPending} className="flex-1">
          Registrar pago
        </Button>
      </div>
    </form>
  );
}
