import { and, asc, desc, eq, gt, isNotNull, lt, sql } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import {
    productImages,
    products,
    productVariants,
} from '@/lib/db/schemas/index.schema';
import { Price } from '@/shared/utils/price.util';
import type {
    ConfirmProductImageInput,
    CreateProductInput,
    CreateVariantInput,
    SearchProductsInput,
    UpdateProductImageInput,
    UpdateProductInput,
    UpdateVariantInput,
} from '../validations/products.validation';

export class ProductsRepository {
    async findById(id: string) {
        return (
            db.query.products.findFirst({
                where: eq(products.id, id),
                with: {
                    category: true,
                    variants: {
                        where: eq(productVariants.isActive, true),
                        orderBy: asc(productVariants.sku),
                    },
                    images: {
                        orderBy: asc(productImages.position),
                    },
                },
            }) ?? null
        );
    }

    async findBySlug(slug: string) {
        return (
            db.query.products.findFirst({
                where: and(
                    eq(products.slug, slug),
                    eq(products.status, 'active'),
                ),
                with: {
                    category: true,
                    variants: {
                        where: eq(productVariants.isActive, true),
                        orderBy: asc(productVariants.sku),
                    },
                    images: {
                        orderBy: asc(productImages.position),
                    },
                },
            }) ?? null
        );
    }

    async search(filters: SearchProductsInput) {
        const {
            q,
            gender,
            sort,
            deals,
            priceMin,
            priceMax,
            categoryId,
            limit,
            cursor,
        } = filters;

        const conditions = [eq(products.status, 'active')];

        if (gender) {
            conditions.push(eq(products.gender, gender));
        }
        if (categoryId) {
            conditions.push(eq(products.categoryId, categoryId));
        }

        if (priceMin) {
            conditions.push(gt(products.basePrice, Price.toCents(priceMin)));
        }
        if (priceMax) {
            conditions.push(lt(products.basePrice, Price.toCents(priceMax)));
        }

        if (deals === 'on_sale') {
            conditions.push(isNotNull(products.originalPrice));
        }
        if (deals === 'free_shipping') {
            conditions.push(eq(products.freeShipping, true));
        }

        if (q) {
            conditions.push(
                sql`${products.searchVector} @@ plainto_tsquery('english', ${q})`,
            );
        }

        if (cursor) {
            conditions.push(gt(products.id, cursor));
        }

        const orderBy = {
            recommended: [desc(products.ratingAvg), desc(products.soldCount)],
            newest: [desc(products.createdAt)],
            price_asc: [asc(products.basePrice)],
            price_desc: [desc(products.basePrice)],
        }[sort] ?? [desc(products.createdAt)];

        const rows = await db.query.products.findMany({
            where: and(...conditions),
            orderBy,
            limit: limit + 1,
            with: {
                images: {
                    where: eq(productImages.isPrimary, true),
                    limit: 1,
                },
            },
        });

        const hasMore = rows.length > limit;
        const data = hasMore ? rows.slice(0, limit) : rows;
        const nextCursor = hasMore ? data[data.length - 1].id : null;

        const [{ total }] = await db
            .select({ total: sql<number>`count(*)::int` })
            .from(products)
            .where(and(...conditions));

        return { data, total, nextCursor, hasMore };
    }

    async create(input: CreateProductInput) {
        const [result] = await db
            .insert(products)
            .values({
                ...input,
                basePrice: Price.toCents(input.basePrice),
                originalPrice: Price.toCents(input.originalPrice ?? null),
            })
            .returning();

        return result;
    }

    async update(id: string, input: UpdateProductInput) {
        const { basePrice, originalPrice, ...rest } = input;

        const [result] = await db
            .update(products)
            .set({
                ...rest,
                ...(basePrice !== undefined && {
                    basePrice: Price.toCents(basePrice),
                }),
                ...(originalPrice !== undefined && {
                    originalPrice:
                        originalPrice === null
                            ? null
                            : Price.toCents(originalPrice),
                }),
                updatedAt: new Date(),
            })
            .where(eq(products.id, id))
            .returning();

        return result ?? null;
    }

    async archive(id: string) {
        const [result] = await db
            .update(products)
            .set({ status: 'archived', updatedAt: new Date() })
            .where(eq(products.id, id))
            .returning();

        return result ?? null;
    }

    async findVariantById(id: string) {
        return (
            db.query.productVariants.findFirst({
                where: eq(productVariants.id, id),
            }) ?? null
        );
    }

    async findVariantsByProductId(productId: string) {
        return db.query.productVariants.findMany({
            where: and(
                eq(productVariants.productId, productId),
                eq(productVariants.isActive, true),
            ),
            orderBy: asc(productVariants.sku),
        });
    }

    async createVariant(productId: string, input: CreateVariantInput) {
        const [result] = await db
            .insert(productVariants)
            .values({
                ...input,
                productId,
                price: Price.toCents(input.price ?? null),
            })
            .returning();

        return result;
    }

    async updateVariant(id: string, input: UpdateVariantInput) {
        const { price, ...rest } = input;

        const result = await db
            .update(productVariants)
            .set({
                ...rest,
                ...(price !== undefined && {
                    price: price === null ? null : Price.toCents(price),
                }),
            })
            .where(eq(productVariants.id, id))
            .returning();

        return result[0] ?? null;
    }

    // ── Images ────────────────────────────────────────────────

    async findImagesByProductId(productId: string) {
        return db.query.productImages.findMany({
            where: eq(productImages.productId, productId),
            orderBy: asc(productImages.position),
        });
    }

    async countImagesByProductId(productId: string) {
        const result = await db.query.productImages.findMany({
            where: eq(productImages.productId, productId),
            columns: { id: true },
        });

        return result.length;
    }

    async createImage(productId: string, input: ConfirmProductImageInput) {
        if (input.isPrimary) {
            await db
                .update(productImages)
                .set({ isPrimary: false })
                .where(eq(productImages.productId, productId));
        }

        const [result] = await db
            .insert(productImages)
            .values({ ...input, productId })
            .returning();

        return result;
    }

    async updateImage(id: string, input: UpdateProductImageInput) {
        const [result] = await db
            .update(productImages)
            .set(input)
            .where(eq(productImages.id, id))
            .returning();

        return result ?? null;
    }

    async deleteImage(id: string) {
        const [result] = await db
            .delete(productImages)
            .where(eq(productImages.id, id))
            .returning();

        return result ?? null;
    }

    async reorderImages(items: { id: string; position: number }[]) {
        await db.transaction(async (tx) => {
            for (const item of items) {
                await tx
                    .update(productImages)
                    .set({ position: item.position })
                    .where(eq(productImages.id, item.id));
            }
        });
    }
}
