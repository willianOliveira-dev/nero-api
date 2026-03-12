import { z } from 'zod';

export const createCategorySchema = z.object({
    name: z
        .string()
        .min(2, { message: 'Nome deve ter no mínimo 2 caracteres.' })
        .max(100, { message: 'Nome deve ter no máximo 100 caracteres.' })
        .nonempty('Nome é obrigatório.'),

    slug: z
        .string()
        .min(2, { message: 'Slug deve ter no mínimo 2 caracteres.' })
        .max(120, { message: 'Slug deve ter no máximo 120 caracteres.' })
        .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            'Slug inválido. Use apenas letras minúsculas, números e hífens.',
        )
        .nonempty('Slug é obrigatório.'),

    parentId: z
        .string()
        .uuid({ message: 'id inválido.', version: 'v7' })
        .optional()
        .nullable()
        .or(z.literal(null)),

    iconUrl: z.string().url().optional().nullable(),
    imageUrl: z.string().url().optional().nullable(),
    sizeGuideUrl: z.string().url().optional().nullable(),

    sortOrder: z.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const categoryParamsSchema = z.object({
    id: z.string().uuid({ message: 'id inválido.', version: 'v7' }),
});

export const categorySlugParamsSchema = z.object({
    slug: z.string().min(1, { message: 'Slug é obrigatório.' }),
});

export const reorderCategoriesSchema = z.object({
    items: z
        .array(
            z.object({
                id: z.string().uuid({ message: 'id inválido.', version: 'v7' }),
                sortOrder: z.coerce
                    .number({
                        message: "O campo 'sortOrder' deve ser um número.",
                    })
                    .int()
                    .min(0),
            }),
        )
        .min(1, { message: 'É necessário informar pelo menos um item.' }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryParams = z.infer<typeof categoryParamsSchema>;
export type CategorySlugParams = z.infer<typeof categorySlugParamsSchema>;
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;
