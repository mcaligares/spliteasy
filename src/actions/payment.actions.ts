'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createPaymentService } from '@/services/payment.service';
import { createPaymentSchema } from '@/lib/validators/payment.schema';
import { logger } from '@/lib/logger';
import type { ActionResponse } from './types';
import type { Payment } from '@/entities/payment.entity';

const log = logger.action('payment');

export async function createPayment(
  _prevState: ActionResponse<Payment>,
  formData: FormData
): Promise<ActionResponse<Payment>> {
  const groupId = formData.get('group_id') as string;
  const amount = parseFloat(formData.get('amount') as string);

  log('createPayment', 'Started', { groupId, amount });

  const parsed = createPaymentSchema.safeParse({
    group_id: groupId,
    paid_to: formData.get('paid_to'),
    amount,
    note: formData.get('note') || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const db = await createClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user) return { success: false, error: 'No autenticado' };

    const paymentService = createPaymentService(db);
    const payment = await paymentService.create(parsed.data, user.id);
    log('createPayment', 'Success', { paymentId: payment.id });
    revalidatePath(`/groups/${groupId}`);
    redirect(`/groups/${groupId}`);
  } catch (error) {
    if ((error as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw error;
    log.error('createPayment', 'Failed', { error: (error as Error).message });
    return { success: false, error: (error as Error).message || 'Error al registrar el pago' };
  }
}
