import { z } from 'zod';
import { appConfig } from '@/config/app.config';

export const createExpenseSchema = z.object({
  group_id: z.string().uuid(),
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(appConfig.expense.maxDescriptionLength, `La descripción no puede superar ${appConfig.expense.maxDescriptionLength} caracteres`),
  amount: z
    .number()
    .positive('El monto debe ser positivo')
    .max(appConfig.expense.maxAmount, `El monto no puede superar ${appConfig.expense.maxAmount}`)
    .refine((v) => Number((v * 100).toFixed(0)) === Math.round(v * 100), {
      message: 'El monto no puede tener más de 2 decimales',
    }),
  paid_by: z.string().uuid('El pagador debe ser un miembro del grupo'),
  participants: z
    .array(z.string().uuid())
    .min(1, 'Debe haber al menos un participante'),
  currency: z.string().default('ARS'),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
