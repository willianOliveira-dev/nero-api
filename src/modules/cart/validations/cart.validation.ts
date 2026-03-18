import { z } from 'zod';

export const addCartItemSchema = z.object({
	productId: z
		.string()
		.uuid({ message: 'id de produto inválido.', version: 'v7' }),
	/** null = produto simples (sem variações) */
	skuId: z
		.string()
		.uuid({ message: 'id de SKU inválido.', version: 'v7' })
		.optional()
		.nullable(),
	quantity: z.coerce
		.number({ message: 'Quantidade deve ser um número.' })
		.int({ message: 'Quantidade deve ser inteiro.' })
		.min(1, { message: 'Quantidade mínima é 1.' })
		.default(1),
});

export const updateCartItemSchema = z.object({
	quantity: z.coerce
		.number({ message: 'Quantidade deve ser um número.' })
		.int({ message: 'Quantidade deve ser inteiro.' })
		.min(1, { message: 'A quantidade mínima é 1.' }),
});

export const applyCouponSchema = z.object({
	code: z
		.string()
		.min(1, { message: 'Código do cupom é obrigatório.' })
		.max(50, { message: 'Código muito longo.' }),
});

export const cartItemParamsSchema = z.object({
	itemId: z.string().uuid({ message: 'id inválido.', version: 'v7' }),
});

export const couponCodeParamsSchema = z.object({
	code: z.string().min(1, { message: 'Código é obrigatório.' }),
});


export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
export type CartItemParams = z.infer<typeof cartItemParamsSchema>;
