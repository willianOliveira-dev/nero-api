import { z } from 'zod';

export const brandParamsSchema = z.object({
    id: z.string().uuid({ message: 'ID inválido.', version: 'v7' }),
});

export const brandSlugParamsSchema = z.object({
    slug: z.string().min(1, { message: 'Slug inválido.' }),
});

export const createBrandSchema = z.object({
    name: z
        .string()
        .min(2, { message: 'Nome deve ter no mínimo 2 caracteres.' })
        .max(120, { message: 'Nome deve ter no máximo 120 caracteres.' })
        .nonempty({ message: 'Nome é obrigatório.' }),
    slug: z
        .string()
        .min(2, { message: 'Slug deve ter no mínimo 2 caracteres.' })
        .max(120, { message: 'Slug deve ter no máximo 120 caracteres.' })
        .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            'Slug inválido. Use apenas letras minúsculas, números e hífens.',
        )
        .nonempty({ message: 'Slug é obrigatório.' }),
    logoUrl: z
        .string({ message: 'URL inválida.' })
        .url({ message: 'URL inválida.' })
        .optional()
        .nullable(),
    isActive: z.boolean().default(true),
});

export const updateBrandSchema = createBrandSchema.partial();

export type BrandParams = z.infer<typeof brandParamsSchema>;
export type BrandSlugParams = z.infer<typeof brandSlugParamsSchema>;
export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
