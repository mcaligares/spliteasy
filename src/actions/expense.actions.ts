'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createExpenseService } from '@/services/expense.service';
import { createExpenseSchema } from '@/lib/validators/expense.schema';
import { logger } from '@/lib/logger';
import type { ActionResponse } from './types';
import type { Expense } from '@/entities/expense.entity';

const log = logger.action('expense');

export async function createExpense(
  _prevState: ActionResponse<Expense>,
  formData: FormData
): Promise<ActionResponse<Expense>> {
  const groupId = formData.get('group_id') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const participants = formData.getAll('participants') as string[];

  log('createExpense', 'Started', { groupId, amount });

  const parsed = createExpenseSchema.safeParse({
    group_id: groupId,
    description: formData.get('description'),
    amount,
    paid_by: formData.get('paid_by'),
    participants,
    currency: formData.get('currency') || 'ARS',
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const db = await createClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user) return { success: false, error: 'No autenticado' };

    const expenseService = createExpenseService(db);
    const expense = await expenseService.create(parsed.data, user.id);
    log('createExpense', 'Success', { expenseId: expense.id });
    revalidatePath(`/groups/${groupId}`);
    redirect(`/groups/${groupId}`);
  } catch (error) {
    if ((error as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw error;
    log.error('createExpense', 'Failed', { error: (error as Error).message });
    return { success: false, error: 'Error al crear el gasto' };
  }
}

export async function deleteExpense(expenseId: string, groupId: string): Promise<ActionResponse> {
  log('deleteExpense', 'Started', { expenseId });
  try {
    const db = await createClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user) return { success: false, error: 'No autenticado' };

    const expenseService = createExpenseService(db);
    await expenseService.delete(expenseId, groupId, user.id);
    log('deleteExpense', 'Success', { expenseId });
    revalidatePath(`/groups/${groupId}`);
    return { success: true };
  } catch (error) {
    log.error('deleteExpense', 'Failed', { error: (error as Error).message });
    return { success: false, error: 'Error al eliminar el gasto' };
  }
}
