'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { createExpense } from '@/actions/expense.actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import type { User } from '@/entities/user.entity';
import type { ActionResponse } from '@/types/api';
import type { Expense } from '@/entities/expense.entity';

interface ExpenseFormProps {
  groupId: string;
  members: User[];
  currentUserId: string;
}

const initialState: ActionResponse<Expense> = { success: false };

export function ExpenseForm({ groupId, members, currentUserId }: ExpenseFormProps) {
  const [state, action, isPending] = useActionState(createExpense, initialState);

  return (
    <form action={action} className="space-y-5">
      {state.error && <Alert type="error" message={state.error} />}
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="currency" value="ARS" />

      <Input
        label="Descripción"
        name="description"
        required
        placeholder="Ej: Cena, Taxi, Supermercado"
      />

      <Input
        label="Monto"
        name="amount"
        type="number"
        required
        min="0.01"
        step="0.01"
        placeholder="0.00"
      />

      <div className="space-y-1">
        <label htmlFor="paid_by" className="block text-sm font-medium text-gray-700">
          ¿Quién pagó?
        </label>
        <select
          id="paid_by"
          name="paid_by"
          defaultValue={currentUserId}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.id === currentUserId ? `${m.name} (yo)` : m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Participantes</p>
        <p className="text-xs text-gray-500">El monto se divide igual entre los seleccionados</p>
        <div className="space-y-2 border border-gray-200 rounded-lg p-3">
          {members.map((m) => (
            <label key={m.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="participants"
                value={m.id}
                defaultChecked
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                {m.id === currentUserId ? `${m.name} (yo)` : m.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Link href={`/groups/${groupId}`} className="flex-1">
          <Button variant="secondary" className="w-full">Cancelar</Button>
        </Link>
        <Button type="submit" loading={isPending} className="flex-1">
          Guardar gasto
        </Button>
      </div>
    </form>
  );
}
