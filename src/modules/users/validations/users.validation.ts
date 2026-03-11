import { z } from 'zod';

// ── PATCH /v1/me ──────────────────────────────────────────────
export const updateProfileSchema = z.object({
    name: z
        .string()
        .min(2, 'Nome deve ter ao menos 2 caracteres.')
        .max(255, 'Nome muito longo.')
        .optional(),

    phone: z
        .string()
        .regex(/^\+?[\d\s\-().]{7,20}$/, 'Telefone inválido.')
        .optional()
        .nullable(),

    genderPreference: z
        .enum(['men', 'women', 'kids', 'unisex'], {
            message: 'Gênero inválido.',
        })
        .optional()
        .nullable(),
});

// ── POST /v1/me/avatar ────────────────────────────────────────
export const uploadAvatarSchema = z.object({
    contentType: z.enum(['image/jpeg', 'image/png', 'image/webp'], {
        message: 'Formato inválido. Use JPEG, PNG ou WebP.',
    }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UploadAvatarInput = z.infer<typeof uploadAvatarSchema>;
