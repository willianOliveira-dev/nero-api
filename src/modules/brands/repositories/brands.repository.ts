import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { brands } from '@/lib/db/schemas/index.schema';
import type {
    CreateBrandInput,
    UpdateBrandInput,
} from '../validations/brands.validation';

export class BrandsRepository {
    async findAll() {
        return db.query.brands.findMany({
            where: eq(brands.isActive, true),
            orderBy: asc(brands.name),
        });
    }

    async findById(id: string) {
        return (
            db.query.brands.findFirst({
                where: eq(brands.id, id),
            }) ?? null
        );
    }

    async findBySlug(slug: string) {
        return (
            db.query.brands.findFirst({
                where: eq(brands.slug, slug),
            }) ?? null
        );
    }

    async create(input: CreateBrandInput) {
        const [result] = await db.insert(brands).values(input).returning();

        return result;
    }

    async update(id: string, input: UpdateBrandInput) {
        const [result] = await db
            .update(brands)
            .set(input)
            .where(eq(brands.id, id))
            .returning();

        return result ?? null;
    }

    async delete(id: string) {
        const [result] = await db
            .update(brands)
            .set({ isActive: false })
            .where(eq(brands.id, id))
            .returning();

        return result ?? null;
    }
}
