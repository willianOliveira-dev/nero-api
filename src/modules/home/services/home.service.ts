import { and, asc, desc, eq, gte, isNotNull } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { productImages, products } from '@/lib/db/schemas/index.schema';
import { NotFoundError } from '@/shared/errors/app.error';
import { Price } from '@/shared/utils/price.util';
import { HomeRepository } from '../repositories/home.repository';
import type {
    CreateHomeSectionInput,
    ReorderHomeSectionsInput,
    UpdateHomeSectionInput,
} from '../validations/home.validation';

const homeRepository = new HomeRepository();

type SectionFilterJson = {
    sort?: 'recommended' | 'newest' | 'price_asc' | 'price_desc';
    gender?: 'men' | 'women' | 'kids' | 'unisex';
    deals?: 'on_sale' | 'free_shipping';
    limit?: number;
    daysAgo?: number;
};

export class HomeService {
    /**
     * Retorna todas as seções ativas com seus dados resolvidos.
     * Cada seção product_list executa sua query de produtos em paralelo.
     */
    async getHome() {
        const sections = await homeRepository.findAllActive();

        const resolved = await Promise.all(
            sections.map(async (section) => {
                if (section.type === 'product_list') {
                    const items = await this.resolveProductList(
                        section.filterJson as SectionFilterJson | null,
                    );
                    return { ...section, items };
                }
                return { ...section, items: [] };
            }),
        );

        return resolved;
    }

    /**
     * Retorna uma seção específica pelo slug com seus dados resolvidos.
     */
    async getSectionBySlug(slug: string) {
        const section = await homeRepository.findBySlug(slug);
        if (!section) {
            throw new NotFoundError('Seção não encontrada.');
        }

        if (section.type === 'product_list') {
            const items = await this.resolveProductList(
                section.filterJson as SectionFilterJson | null,
            );
            return { ...section, items };
        }

        return { ...section, items: [] };
    }

    async listAll() {
        return homeRepository.findAll();
    }

    async create(input: CreateHomeSectionInput) {
        return homeRepository.create(input);
    }

    async update(id: string, input: UpdateHomeSectionInput) {
        await this.findOrFail(id);
        const updated = await homeRepository.update(id, input);
        if (!updated) {
            throw new NotFoundError('Seção não encontrada.');
        }
        return updated;
    }

    async delete(id: string) {
        await this.findOrFail(id);
        await homeRepository.delete(id);
        return { deleted: true };
    }

    async reorder(input: ReorderHomeSectionsInput) {
        await homeRepository.reorder(input.items);
        return { reordered: true };
    }

    private async findOrFail(id: string) {
        const section = await homeRepository.findById(id);
        if (!section) {
            throw new NotFoundError('Seção não encontrada.');
        }
        return section;
    }

    /**
     * Executa a query de produtos de uma seção usando o filterJson.
     * Retorna produtos serializados com preço formatado.
     */
    private async resolveProductList(filter: SectionFilterJson | null) {
        const {
            sort = 'recommended',
            gender,
            deals,
            limit = 10,
            daysAgo,
        } = filter ?? {};

        const conditions = [eq(products.status, 'active')];

        if (gender) {
            conditions.push(eq(products.gender, gender));
        }

        if (deals === 'on_sale') {
            conditions.push(isNotNull(products.originalPrice));
        }
        if (deals === 'free_shipping') {
            conditions.push(eq(products.freeShipping, true));
        }

        if (daysAgo) {
            const since = new Date();
            since.setDate(since.getDate() - daysAgo);
            conditions.push(gte(products.createdAt, since));
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
            limit,
            with: {
                images: {
                    where: eq(productImages.isPrimary, true),
                    limit: 1,
                },
            },
        });

        return rows.map((product) => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: Price.toProductOutput(
                product.basePrice,
                product.originalPrice,
            ),
            freeShipping: product.freeShipping,
            ratingAvg: product.ratingAvg ? Number(product.ratingAvg) : null,
            ratingCount: product.ratingCount,
            soldCount: product.soldCount,
            imageUrl: product.images?.[0]?.url ?? null,
        }));
    }
}
