import { z } from 'zod';

// ── Enums ─────────────────────────────────────────────────────
const productStatusEnum = z.enum(['draft', 'active', 'archived']);
const productGenderEnum = z.enum(['men', 'women', 'kids', 'unisex']);

// ── Variant ───────────────────────────────────────────────────
export const createVariantSchema = z.object({
    sku: z
        .string()
        .min(1, { message: 'SKU deve ter ao menos  1 caracter.' })
        .max(100, { message: 'SKU deve ter no máximo 100 caracteres.' }),
    price: z.coerce
        .number({ message: 'Preço deve ser um número.' })
        .positive({ message: 'Preço deve ser positivo.' })
        .optional()
        .nullable(),
    stock: z.coerce
        .number({ message: 'Estoque deve ser um número.' })
        .int({ message: 'Estoque deve ser um número inteiro.' })
        .min(0, { message: 'Estoque não pode ser negativo.' })
        .default(0),
    attributes: z.record(z.string(), z.string()),
    isActive: z.boolean().default(true),
});

export const updateVariantSchema = createVariantSchema.partial();

// ── Product ───────────────────────────────────────────────────
export const createProductSchema = z.object({
    name: z
        .string()
        .min(3, { message: 'Nome deve ter ao menos 2 caracteres.' })
        .max(255, { message: 'Nome muito longo.' })
        .nonempty({ message: 'Nome obrigatório.' }),

    slug: z
        .string()
        .min(3, { message: 'Nome deve ter ao menos 2 caracteres.' })
        .max(280, { message: 'Nome muito longo.' })
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido.')
        .nonempty({
            message: 'Slug é obrigatório.',
        }),

    description: z.string().optional().nullable(),
    basePrice: z.coerce
        .number({ message: 'Preço base deve ser um número.' })
        .positive({ message: 'Preço base deve ser positivo.' }),
    originalPrice: z.coerce
        .number({ message: 'Preço deve ser um número.' })
        .positive({ message: 'Preço deve ser positivo.' })
        .optional()
        .nullable(),
    categoryId: z
        .string()
        .uuid({ message: 'id inválido.', version: 'v7' })
        .optional()
        .nullable(),
    gender: productGenderEnum,
    status: productStatusEnum.default('draft'),
    freeShipping: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
});

export const updateProductSchema = createProductSchema.partial();

// ── Search / Filters ──────────────────────────────────────────
export const searchProductsSchema = z.object({
    q: z.string().optional(),
    gender: productGenderEnum.optional(),
    sort: z
        .enum(['recommended', 'newest', 'price_asc', 'price_desc'])
        .default('recommended'),
    deals: z.enum(['on_sale', 'free_shipping']).optional(),
    priceMin: z.coerce.number().positive().optional(),
    priceMax: z.coerce.number().positive().optional(),
    categoryId: z.string().uuid({ message: 'Id inválido.' }).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z
        .string()
        .uuid({ message: 'Id inválido.', version: 'v7' })
        .optional(),
});

// ── Images ────────────────────────────────────────────────────
export const confirmProductImageSchema = z.object({
    url: z.string().url({ message: 'URL inválida.' }).or(z.literal('')),
    altText: z
        .string()
        .max(255, { message: 'Texto alternativo muito longo.' })
        .optional()
        .nullable(),
    position: z.coerce
        .number({ message: 'Posição deve ser um número' })
        .int({ message: 'Posição deve ser um número inteiro' })
        .min(1, { message: 'Posição mínima atingida' })
        .max(5, { message: 'Posição máxima atiginda' }),
    isPrimary: z.boolean().default(false),
    variantId: z
        .string()
        .uuid({ message: 'Id inválido.', version: 'v7' })
        .optional()
        .nullable(),
});

export const updateProductImageSchema = confirmProductImageSchema.partial();

export const reorderImagesSchema = z.object({
    items: z
        .array(
            z.object({
                id: z.string().uuid({ message: 'id inválido.', version: 'v7' }),
                position: z.coerce
                    .number({ message: 'Posição deve ser um número' })
                    .int({ message: 'Posição deve ser um número inteiro' })
                    .min(1, { message: 'Posição mínima atingida.' })
                    .max(5, { message: 'Posição máxima atingida.' }),
            }),
        )
        .min(1, { message: 'É necessário informar pelo menos uma imagem.' })
        .max(5, { message: 'Só é possível adicionar até 5 imagens.' }),
});

// ── Params ────────────────────────────────────────────────────
export const productParamsSchema = z.object({
    id: z.string().uuid({ message: 'id inválido.', version: 'v7' }),
});

export const productSlugParamsSchema = z.object({
    slug: z.string().min(1, { message: 'Slug é obrigatório.' }),
});

export const variantParamsSchema = z.object({
    id: z.string().uuid({ message: 'id inválido.', version: 'v7' }),
    vid: z
        .string()
        .uuid({ message: 'Id de variante inválido.', version: 'v7' }),
});

export const imageParamsSchema = z.object({
    id: z.string().uuid({ message: 'id inválido.', version: 'v7' }),
    iid: z.string().uuid({ message: 'id inválido.', version: 'v7' }),
});

// ── Tipos inferidos ───────────────────────────────────────────
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type SearchProductsInput = z.infer<typeof searchProductsSchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type ConfirmProductImageInput = z.infer<
    typeof confirmProductImageSchema
>;
export type UpdateProductImageInput = z.infer<typeof updateProductImageSchema>;
export type ReorderImagesInput = z.infer<typeof reorderImagesSchema>;
export type ProductParams = z.infer<typeof productParamsSchema>;
export type ProductSlugParams = z.infer<typeof productSlugParamsSchema>;
export type VariantParams = z.infer<typeof variantParamsSchema>;
export type ImageParams = z.infer<typeof imageParamsSchema>;
