import { z } from 'zod';

export const createReviewSchema = z.object({
    productId: z.string().uuid(),
    orderId: z.string().uuid().optional(),
    rating: z.number().int().min(1).max(5),
    title: z.string().max(120).optional(),
    comment: z.string().optional(),
    variantPurchased: z.string().max(255).optional(),
    media: z.array(z.object({
        type: z.enum(['image', 'video']),
        url: z.string().url(),
        thumbnailUrl: z.string().url().optional(),
        duration: z.string().optional(),
    })).optional(),
});

export const listReviewsQuerySchema = z.object({
    productId: z.string().uuid(),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    cursor: z.string().optional(),
});

export const reviewParamsSchema = z.object({
    id: z.string().uuid(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
export type ReviewParams = z.infer<typeof reviewParamsSchema>;
