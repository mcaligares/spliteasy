'use client';

import { useActionState } from 'react';
import { addMemberToGroup } from '@/actions/group.actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import type { ActionResponse } from '@/types/api';
import type { GroupMember } from '@/entities/group-member.entity';

interface AddMemberFormProps {
  groupId: string;
}

const initialState: ActionResponse<GroupMember> = { success: false };

export function AddMemberForm({ groupId }: AddMemberFormProps) {
  const [state, action, isPending] = useActionState(addMemberToGroup, initialState);

  return (
    <form action={action} className="space-y-3">
      {state.error && <Alert type="error" message={state.error} />}
      {state.success && <Alert type="success" message="Miembro agregado correctamente" />}
      <input type="hidden" name="groupId" value={groupId} />
      <div className="flex gap-2">
        <Input
          name="email"
          type="email"
          placeholder="email@ejemplo.com"
          className="flex-1"
        />
        <Button type="submit" loading={isPending} size="md">
          Agregar
        </Button>
      </div>
    </form>
  );
}
