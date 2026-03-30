import { z } from 'zod';
import { appConfig } from '@/config/app.config';

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(appConfig.group.maxNameLength, `El nombre no puede superar ${appConfig.group.maxNameLength} caracteres`),
  description: z
    .string()
    .max(appConfig.group.maxDescriptionLength, `La descripción no puede superar ${appConfig.group.maxDescriptionLength} caracteres`)
    .optional(),
});

export const addMemberSchema = z.object({
  groupId: z.string().uuid(),
  email: z.string().email('Email inválido'),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
