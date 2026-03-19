import { and, desc, eq, gt, sql } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import {
    productReviews,
    reviewLikes,
    reviewMedia,
    products,
} from '@/lib/db/schemas/index.schema';
import type {
    CreateReviewInput,
} from '../validations/reviews.validation';

export class ReviewsRepository {
    async findByProductId(
        productId: string,
        limit: number,
        cursor?: string,
        userId?: string,
    ) {
        const conditions = [
            eq(productReviews.productId, productId),
            eq(productReviews.status, 'approved'),
        ];

        if (cursor) {
            conditions.push(gt(productReviews.id, cursor));
        }

        const rows = await db.query.productReviews.findMany({
            where: and(...conditions),
            orderBy: desc(productReviews.createdAt),
            limit: limit + 1,
            with: {
                user: { columns: { id: true, name: true, image: true } },
                media: { orderBy: desc(reviewMedia.createdAt) },
            },
        });

        const hasMore = rows.length > limit;
        const data = hasMore ? rows.slice(0, limit) : rows;
        const nextCursor = hasMore ? data[data.length - 1].id : null;

        let userLikedIds = new Set<string>();
        if (userId && data.length > 0) {
            const ids = data.map((r) => r.id);
            const likes = await db.query.reviewLikes.findMany({
                where: and(
                    eq(reviewLikes.userId, userId),
                    sql`${reviewLikes.reviewId} = ANY(ARRAY[${sql.join(
                        ids.map((id) => sql`${id}`),
                        sql`, `,
                    )}]::text[])`,
                ),
                columns: { reviewId: true },
            });
            userLikedIds = new Set(likes.map((l) => l.reviewId));
        }

        return { data, hasMore, nextCursor, userLikedIds };
    }

    async create(userId: string, input: CreateReviewInput) {
        return await db.transaction(async (tx) => {
            const { media, ...reviewData } = input;
            
            const [review] = await tx.insert(productReviews).values({
                ...reviewData,
                userId,
                status: 'approved', // Auto-approve for now so mobile users see their reviews immediately
            }).returning();

            if (media && media.length > 0) {
                await tx.insert(reviewMedia).values(
                    media.map((m, index) => ({
                        reviewId: review.id,
                        type: m.type,
                        imageUrl: m.url,
                        thumbnailUrl: m.thumbnailUrl,
                        duration: m.duration,
                        sortOrder: index,
                    }))
                );
            }

            // --- Recalculate product rating ---
            const [stats] = await tx
                .select({
                    count: sql<number>`count(*)::int`,
                    avg: sql<number>`avg(rating)::numeric(3,2)`,
                })
                .from(productReviews)
                .where(
                    and(
                        eq(productReviews.productId, review.productId),
                        eq(productReviews.status, 'approved')
                    )
                );

            await tx
                .update(products)
                .set({
                    ratingCount: stats.count || 0,
                    ratingAvg: stats.avg ? String(stats.avg) : '0.00',
                })
                .where(eq(products.id, review.productId));
            // ----------------------------------

            return review;
        });
    }

    async findById(id: string) {
        return db.query.productReviews.findFirst({
            where: eq(productReviews.id, id),
            with: {
                media: true,
                user: { columns: { id: true, name: true, image: true } },
            }
        }) ?? null;
    }

    async toggleLike(reviewId: string, userId: string) {
        return await db.transaction(async (tx) => {
            const existing = await tx.query.reviewLikes.findFirst({
                where: and(
                    eq(reviewLikes.reviewId, reviewId),
                    eq(reviewLikes.userId, userId)
                )
            });

            if (existing) {
                await tx.delete(reviewLikes).where(and(
                    eq(reviewLikes.reviewId, reviewId),
                    eq(reviewLikes.userId, userId)
                ));
                await tx.update(productReviews)
                    .set({ likesCount: sql`${productReviews.likesCount} - 1` })
                    .where(eq(productReviews.id, reviewId));
                return { liked: false };
            } else {
                await tx.insert(reviewLikes).values({ reviewId, userId });
                await tx.update(productReviews)
                    .set({ likesCount: sql`${productReviews.likesCount} + 1` })
                    .where(eq(productReviews.id, reviewId));
                return { liked: true };
            }
        });
    }
}
