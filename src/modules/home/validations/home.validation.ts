import { z } from 'zod';

export const sectionTypeEnum = z.enum(
    ['top_selling', 'new_in', 'on_sale', 'free_shipping', 'by_gender', 'category_list', 'banner'],
    { message: 'Tipo inválido.' },
);

export const homeSectionParamsSchema = z.object({
    id: z.string().uuid({ message: 'ID inválido.', version: 'v7' }),
});

export const homeSectionSlugParamsSchema = z.object({
    slug: z.string().min(1, { message: 'Slug inválido.' }),
});

export const createHomeSectionSchema = z.object({
    slug: z
        .string()
        .min(2, { message: 'O slug deve ter no mínimo 2 caracteres.' })
        .max(80, { message: 'O slug deve ter no máximo 80 caracteres.' })
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido.'),
    title: z
        .string()
        .min(2, { message: 'O título deve ter no mínimo 2 caracteres.' })
        .max(120, { message: 'O título deve ter no máximo 120 caracteres.' }),
    type: sectionTypeEnum,
    sortOrder: z
        .number({ message: 'A posição deve ser um número.' })
        .int({ message: 'A posição deve ser um número inteiro.' })
        .min(0, { message: 'A posição não pode ser negativa.' })
        .default(0),
    isActive: z.boolean().default(true),
    filterJson: z
        .object({
            gender: z
                .enum(['men', 'women', 'kids', 'unisex'], { message: 'Valor inválido.' })
                .optional(),
            limit: z
                .number({ message: 'O limite deve ser um número.' })
                .int({ message: 'O limite deve ser um número inteiro.' })
                .min(1, { message: 'O limite deve ser maior que zero.' })
                .max(50, { message: 'O limite deve ser menor que 50.' })
                .optional(),
            daysAgo: z
                .number({ message: 'O número de dias deve ser um número.' })
                .int({ message: 'O número de dias deve ser um número inteiro.' })
                .min(1, { message: 'O período deve ser de pelo menos 1 dia.' })
                .optional(),
        })
        .optional()
        .nullable(),
});

export const updateHomeSectionSchema = createHomeSectionSchema.partial();

export const reorderHomeSectionsSchema = z.object({
    items: z
        .array(
            z.object({
                id: z.string().uuid({ message: 'ID inválido.', version: 'v7' }),
                sortOrder: z
                    .number({ message: 'A posição deve ser um número.' })
                    .int({ message: 'A posição deve ser um número inteiro.' })
                    .min(0, { message: 'A posição não pode ser negativa.' }),
            }),
        )
        .min(1, { message: 'É necessário informar pelo menos um item.' }),
});

export type HomeSectionParams        = z.infer<typeof homeSectionParamsSchema>;
export type HomeSectionSlugParams    = z.infer<typeof homeSectionSlugParamsSchema>;
export type CreateHomeSectionInput   = z.infer<typeof createHomeSectionSchema>;
export type UpdateHomeSectionInput   = z.infer<typeof updateHomeSectionSchema>;
export type ReorderHomeSectionsInput = z.infer<typeof reorderHomeSectionsSchema>;
export type SectionType              = z.infer<typeof sectionTypeEnum>;

export const getHomeQuerySchema = z.object({
	gender: z.enum(['men', 'women', 'kids', 'unisex']).optional(),
});
export type GetHomeQuery = z.infer<typeof getHomeQuerySchema>;