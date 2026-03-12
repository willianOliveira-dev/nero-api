import { z } from 'zod';

export const addCartItemSchema = z.object({
    productId: z
        .string()
        .uuid({ message: 'ID de produto inválido.', version: 'v7' }),
    variantId: z
        .string()
        .uuid({ message: 'ID de variante inválido.', version: 'v7' })
        .optional()
        .nullable(),
    quantity: z.coerce
        .number({ message: 'Quantidade deve ser um número.' })
        .int({ message: 'Quantidade deve ser um número inteiro.' })
        .min(1, { message: 'Quantidade mínima é 1.' })
        .max(99),
});

export const updateCartItemSchema = z.object({
    quantity: z.coerce
        .number({ message: 'Quantidade deve ser um número.' })
        .int({ message: 'Quantidade deve ser um número inteiro.' })
        .min(1, { message: 'Quantidade mínima é 1.' })
        .max(99, { message: 'Quantidade máxima é 99.' }),
});

export const applyCouponSchema = z.object({
    code: z
        .string()
        .min(1, { message: 'Código do cupom é obrigatório.' })
        .toUpperCase(),
});

export const cartItemParamsSchema = z.object({
    itemId: z
        .string()
        .uuid({ message: 'ID de item do carrinho inválido.', version: 'v7' }),
});

export const couponCodeParamsSchema = z.object({
    code: z.string().min(1, { message: 'Código do cupom é obrigatório.' }),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
export type CartItemParams = z.infer<typeof cartItemParamsSchema>;
export type CouponCodeParams = z.infer<typeof couponCodeParamsSchema>;
