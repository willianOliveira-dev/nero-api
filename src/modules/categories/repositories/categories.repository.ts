import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { categories } from '@/lib/db/schemas/index.schema';
import type {
    CreateCategoryInput,
    UpdateCategoryInput,
} from '../validations/categories.validation';

export class CategoriesRepository {
    /**
     * Lista todas as categorias ativas com suas subcategorias.
     */
    async findAllActive() {
        return db.query.categories.findMany({
            where: eq(categories.isActive, true),
            orderBy: asc(categories.sortOrder),
            with: {
                subcategories: {
                    where: eq(categories.isActive, true),
                    orderBy: asc(categories.sortOrder),
                },
            },
        });
    }

    /**
     * Busca categoria por slug com subcategorias.
     */
    async findBySlug(slug: string) {
        return (
            db.query.categories.findFirst({
                where: eq(categories.slug, slug),
                with: {
                    subcategories: {
                        where: eq(categories.isActive, true),
                        orderBy: asc(categories.sortOrder),
                    },
                },
            }) ?? null
        );
    }

    /**
     * Busca categoria por ID.
     */
    async findById(id: string) {
        return (
            db.query.categories.findFirst({
                where: eq(categories.id, id),
                with: { subcategories: true },
            }) ?? null
        );
    }

    async create(input: CreateCategoryInput) {
        const [result] = await db.insert(categories).values(input).returning();

        return result;
    }

    async update(id: string, input: UpdateCategoryInput) {
        const [result] = await db
            .update(categories)
            .set(input)
            .where(eq(categories.id, id))
            .returning();

        return result ?? null;
    }

    /**
     * Soft delete — apenas desativa a categoria.
     */
    async deactivate(id: string) {
        const [result] = await db
            .update(categories)
            .set({ isActive: false })
            .where(eq(categories.id, id))
            .returning();

        return result ?? null;
    }

    /**
     * Atualiza sortOrder de múltiplas categorias em uma query só.
     */
    async reorder(items: { id: string; sortOrder: number }[]) {
        await db.transaction(async (tx) => {
            for (const item of items) {
                await tx
                    .update(categories)
                    .set({ sortOrder: item.sortOrder })
                    .where(eq(categories.id, item.id));
            }
        });
    }
}
