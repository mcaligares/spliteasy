'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { ArrowLeft, X, Check } from 'lucide-react';
import { createGroup } from '@/actions/group.actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import type { ActionResponse } from '@/types/api';
import type { Group } from '@/entities/group.entity';

const initialState: ActionResponse<Group> = { success: false };

export default function NewGroupPage() {
  const [state, action, isPending] = useActionState(createGroup, initialState);

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/groups" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          Volver a grupos
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Nuevo grupo</h1>
      </div>
      <Card>
        <form action={action} className="space-y-5">
          {state.error && <Alert type="error" message={state.error} />}
          <Input
            label="Nombre del grupo"
            name="name"
            required
            placeholder="Ej: Vacaciones 2024, Depto compartido"
          />
          <div className="space-y-1">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descripción <span className="text-gray-400">(opcional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Descripción opcional del grupo"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Link href="/groups" className="flex-1">
              <Button variant="secondary" className="w-full">
                <X className="h-4 w-4 mr-1.5" />
                Cancelar
              </Button>
            </Link>
            <Button type="submit" loading={isPending} className="flex-1">
              <Check className="h-4 w-4 mr-1.5" />
              Crear grupo
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
