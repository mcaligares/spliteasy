import { z } from 'zod';

export const createPaymentSchema = z.object({
  group_id: z.string().uuid(),
  paid_to: z.string().uuid('El destinatario debe ser un miembro del grupo'),
  amount: z
    .number()
    .positive('El monto debe ser positivo')
    .refine((v) => Number((v * 100).toFixed(0)) === Math.round(v * 100), {
      message: 'El monto no puede tener más de 2 decimales',
    }),
  note: z
    .string()
    .max(200, 'La nota no puede superar 200 caracteres')
    .optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
