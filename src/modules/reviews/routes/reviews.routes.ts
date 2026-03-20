import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
    createReviewHandler,
    listReviewsHandler,
    presignMediaHandler,
    toggleLikeHandler,
} from '../handlers/reviews.handlers';
import {
    createReviewSchema,
    listReviewsQuerySchema,
    reviewParamsSchema,
} from '../validations/reviews.validation';

const reviewResponseSchema = z.object({
    id: z.string().uuid(),
    rating: z.number(),
    title: z.string().nullable(),
    comment: z.string().nullable(),
    variant: z.string().nullable(),
    isVerified: z.boolean(),
    createdAt: z.date(),
    user: z.object({
        id: z.string(),
        name: z.string(),
        avatar: z.string().nullable(),
    }).nullable(),
    likes: z.object({
        count: z.number(),
        likedByMe: z.boolean(),
    }),
    media: z.array(z.object({
        type: z.enum(['image', 'video']),
        url: z.string().url(),
        thumbnail: z.string().nullable(),
        duration: z.string().nullable(),
    })),
});


export const reviewsRoutes: FastifyPluginAsyncZod = async (app) => {
	app.addHook('preHandler', app.authenticate);
    app.get('/reviews', {
        schema: {
            tags: ['Reviews'],
            summary: 'Listar avaliações de um produto',
            operationId: 'listReviews',
            querystring: listReviewsQuerySchema,
            response: {
                200: z.object({
                    items: z.array(reviewResponseSchema),
                    hasMore: z.boolean(),
                    nextCursor: z.string().nullable(),
                }),
            },
        },
        handler: listReviewsHandler,
    });

    app.post('/reviews', {
        schema: {
            tags: ['Reviews'],
            summary: 'Criar uma avaliação',
            operationId: 'createReview',
            body: createReviewSchema,
            response: {
                201: z.object({
                    id: z.string().uuid(),
                    status: z.string(),
                }),
            },
        },
        
        handler: createReviewHandler,
    });

    app.post('/reviews/:id/like', {
        schema: {
            tags: ['Reviews'],
            summary: 'Curtir/Descurtir uma avaliação',
            operationId: 'toggleReviewLike',
            params: reviewParamsSchema,
            response: {
                200: z.object({
                    liked: z.boolean(),
                }),
            },
        },
        
        handler: toggleLikeHandler,
    });

    app.post('/reviews/media/presign', {
        schema: {
            tags: ['Reviews'],
            summary: 'Gerar assinatura para upload de mídia',
            operationId: 'presignReviewMedia',
            response: {
                200: z.object({
                    data: z.object({
                        signature: z.string(),
                        timestamp: z.number(),
                        folder: z.string(),
                        publicId: z.string().optional(),
                        cloudName: z.string(),
                        apiKey: z.string(),
                    }),
                }),
            },
        },
        
        handler: presignMediaHandler,
    });
};
