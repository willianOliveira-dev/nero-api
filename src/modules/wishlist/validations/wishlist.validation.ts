import { z } from 'zod';

export const wishlistProductParamsSchema = z.object({
	productId: z
		.string()
		.uuid({ message: 'id de produto inválido.', version: 'v7' }),
});

export type WishlistProductParams = z.infer<typeof wishlistProductParamsSchema>;
