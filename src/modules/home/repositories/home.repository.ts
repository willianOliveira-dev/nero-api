import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { homeSections } from '@/lib/db/schemas/index.schema';
import type {
    CreateHomeSectionInput,
    UpdateHomeSectionInput,
} from '../validations/home.validation';

export class HomeRepository {
    /**
     * Lista todas as seções ativas ordenadas por sortOrder.
     */
    async findAllActive() {
        return db.query.homeSections.findMany({
            where: eq(homeSections.isActive, true),
            orderBy: asc(homeSections.sortOrder),
        });
    }

    /**
     * Lista todas as seções (admin) — ativas e inativas.
     */
    async findAll() {
        return db.query.homeSections.findMany({
            orderBy: asc(homeSections.sortOrder),
        });
    }

    async findById(id: string) {
        return (
            db.query.homeSections.findFirst({
                where: eq(homeSections.id, id),
            }) ?? null
        );
    }

    async findBySlug(slug: string) {
        return (
            db.query.homeSections.findFirst({
                where: eq(homeSections.slug, slug),
            }) ?? null
        );
    }

    async create(input: CreateHomeSectionInput) {
        const [result] = await db
            .insert(homeSections)
            .values(input)
            .returning();

        return result;
    }

    async update(id: string, input: UpdateHomeSectionInput) {
        const [result] = await db
            .update(homeSections)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(homeSections.id, id))
            .returning();

        return result ?? null;
    }

    async delete(id: string) {
        const [result] = await db
            .delete(homeSections)
            .where(eq(homeSections.id, id))
            .returning();

        return result ?? null;
    }

    async reorder(items: { id: string; sortOrder: number }[]) {
        await db.transaction(async (tx) => {
            for (const item of items) {
                await tx
                    .update(homeSections)
                    .set({ sortOrder: item.sortOrder })
                    .where(eq(homeSections.id, item.id));
            }
        });
    }
}
