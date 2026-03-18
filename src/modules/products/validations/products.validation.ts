import { z } from 'zod';

const productStatusEnum = z.enum(['draft', 'active', 'archived']);
const productGenderEnum = z.enum(['men', 'women', 'kids', 'unisex']);


const createVariationOptionSchema = z.object({
	value: z
		.string()
		.min(1, { message: 'Valor da opção é obrigatório.' })
		.max(100, { message: 'Valor muito longo.' }),
	imageUrl: z.string().url({ message: 'URL inválida.' }).optional().nullable(),
});

const createVariationTypeSchema = z.object({
	name: z
		.string()
		.min(1, { message: 'Nome da variação é obrigatório.' })
		.max(100, { message: 'Nome muito longo.' }),
	options: z
		.array(createVariationOptionSchema)
		.min(1, { message: 'Ao menos uma opção é obrigatória.' }),
});



const createSkuSchema = z.object({
	optionValues: z
		.array(z.string().min(1))
		.min(1, { message: 'optionValues obrigatório.' }),
	price: z.coerce
		.number({ message: 'Preço deve ser um número.' })
		.positive({ message: 'Preço deve ser positivo.' }),
	compareAtPrice: z.coerce
		.number({ message: 'Preço deve ser um número.' })
		.positive({ message: 'Preço deve ser positivo.' })
		.optional()
		.nullable(),
	stock: z.coerce
		.number({ message: 'Estoque deve ser um número.' })
		.int({ message: 'Estoque deve ser inteiro.' })
		.min(0, { message: 'Estoque não pode ser negativo.' })
		.default(0),
	skuCode: z
		.string()
		.min(1, { message: 'SKU é obrigatório.' })
		.max(100, { message: 'SKU muito longo.' }),
	ean: z
		.string()
		.max(14, { message: 'EAN deve ter no máximo 14 caracteres.' })
		.optional()
		.nullable(),
});


export const createProductSchema = z.object({
	name: z
		.string()
		.min(3, { message: 'Nome deve ter ao menos 3 caracteres.' })
		.max(255, { message: 'Nome muito longo.' })
		.nonempty({ message: 'Nome obrigatório.' }),

	slug: z
		.string()
		.min(3, { message: 'Slug deve ter ao menos 3 caracteres.' })
		.max(280, { message: 'Slug muito longo.' })
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido.')
		.nonempty({ message: 'Slug é obrigatório.' }),

	description: z.string().optional().nullable(),

	categoryId: z
		.string()
		.uuid({ message: 'ID inválido.', version: 'v7' })
		.optional()
		.nullable(),

	brandId: z
		.string()
		.uuid({ message: 'ID inválido.', version: 'v7' })
		.optional()
		.nullable(),

	gender: productGenderEnum,
	status: productStatusEnum.default('draft'),
	freeShipping: z.boolean().default(false),

	thumbnailUrl: z.string().url().optional().nullable(),
	sizeChartUrl: z.string().url().optional().nullable(),

	price: z.coerce
		.number({ message: 'Preço deve ser um número.' })
		.positive({ message: 'Preço deve ser positivo.' })
		.optional()
		.nullable(),
	compareAtPrice: z.coerce
		.number({ message: 'Preço deve ser um número.' })
		.positive({ message: 'Preço deve ser positivo.' })
		.optional()
		.nullable(),
	stock: z.coerce
		.number()
		.int()
		.min(0)
		.optional()
		.nullable(),
	skuCode: z.string().max(100).optional().nullable(),
	ean: z.string().max(14).optional().nullable(),

	variationTypes: z.array(createVariationTypeSchema).optional().nullable(),
	skus: z.array(createSkuSchema).optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial();

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

// ── Imagens ───────────────────────────────────────────────────

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

// ── SKU (admin update) ────────────────────────────────────────

export const updateSkuSchema = z.object({
	price: z.coerce.number().positive().optional(),
	compareAtPrice: z.coerce.number().positive().optional().nullable(),
	stock: z.coerce.number().int().min(0).optional(),
	skuCode: z.string().min(1).max(100).optional(),
	ean: z.string().max(14).optional().nullable(),
	isActive: z.boolean().optional(),
});

// ── Params ────────────────────────────────────────────────────

export const productParamsSchema = z.object({
	id: z.string().uuid({ message: 'id inválido.', version: 'v7' }),
});

export const productSlugParamsSchema = z.object({
	slug: z.string().min(1, { message: 'Slug é obrigatório.' }),
});

export const skuParamsSchema = z.object({
	id: z.string().uuid({ message: 'id inválido.', version: 'v7' }),
	skuId: z
		.string()
		.uuid({ message: 'id de SKU inválido.', version: 'v7' }),
});

export const imageParamsSchema = z.object({
	id: z.string().uuid({ message: 'id inválido.', version: 'v7' }),
	iid: z.string().uuid({ message: 'id inválido.', version: 'v7' }),
});

// ── Exported Types ────────────────────────────────────────────

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type SearchProductsInput = z.infer<typeof searchProductsSchema>;
export type UpdateSkuInput = z.infer<typeof updateSkuSchema>;
export type ConfirmProductImageInput = z.infer<
	typeof confirmProductImageSchema
>;
export type UpdateProductImageInput = z.infer<typeof updateProductImageSchema>;
export type ReorderImagesInput = z.infer<typeof reorderImagesSchema>;
export type ProductParams = z.infer<typeof productParamsSchema>;
export type ProductSlugParams = z.infer<typeof productSlugParamsSchema>;
export type SkuParams = z.infer<typeof skuParamsSchema>;
export type ImageParams = z.infer<typeof imageParamsSchema>;
