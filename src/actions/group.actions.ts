'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createGroupService } from '@/services/group.service';
import { createGroupSchema, addMemberSchema } from '@/lib/validators/group.schema';
import { logger } from '@/lib/logger';
import type { ActionResponse } from './types';
import type { Group } from '@/entities/group.entity';
import type { GroupMember } from '@/entities/group-member.entity';
import type { User } from '@/entities/user.entity';

export async function createGroup(
  _prevState: ActionResponse<Group>,
  formData: FormData
): Promise<ActionResponse<Group>> {
  logger.action('createGroup', 'Started', { name: formData.get('name') });

  const parsed = createGroupSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const db = await createClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user) return { success: false, error: 'No autenticado' };

    const groupService = createGroupService(db);
    const group = await groupService.create(parsed.data, user.id);
    logger.action('createGroup', 'Success', { groupId: group.id });
    revalidatePath('/groups');
    redirect(`/groups/${group.id}`);
  } catch (error) {
    if ((error as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw error;
    logger.error('createGroup', 'Failed', { error: (error as Error).message });
    return { success: false, error: 'Error al crear el grupo' };
  }
}

export async function addMemberToGroup(
  _prevState: ActionResponse<GroupMember>,
  formData: FormData
): Promise<ActionResponse<GroupMember>> {
  const groupId = formData.get('groupId') as string;
  const email = formData.get('email') as string;

  logger.action('addMemberToGroup', 'Started', { groupId });

  const parsed = addMemberSchema.safeParse({ groupId, email });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const db = await createClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user) return { success: false, error: 'No autenticado' };

    const groupService = createGroupService(db);
    const member = await groupService.addMember(groupId, email, user.id);
    logger.action('addMemberToGroup', 'Success', { memberId: member.id });
    revalidatePath(`/groups/${groupId}`);
    return { success: true, data: member };
  } catch (error) {
    logger.error('addMemberToGroup', 'Failed', { error: (error as Error).message });
    return { success: false, error: (error as Error).message };
  }
}

export async function getGroupMembers(groupId: string): Promise<(GroupMember & { user: User })[]> {
  logger.action('getGroupMembers', 'Started', { groupId });
  try {
    const db = await createClient();
    const groupService = createGroupService(db);
    const members = await groupService.getMembers(groupId);
    logger.action('getGroupMembers', 'Success', { count: members.length });
    return members;
  } catch (error) {
    logger.error('getGroupMembers', 'Failed', { error: (error as Error).message });
    return [];
  }
}
