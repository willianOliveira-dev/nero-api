import { and, desc, eq, gte, isNotNull, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { productImages, products } from '@/lib/db/schemas/index.schema';
import { NotFoundError } from '@/shared/errors/app.error';
import { Price } from '@/shared/utils/price.util';
import { HomeRepository } from '../repositories/home.repository';
import type {
    CreateHomeSectionInput,
    ReorderHomeSectionsInput,
    SectionType,
    UpdateHomeSectionInput,
} from '../validations/home.validation';

const homeRepository = new HomeRepository();

type SectionFilterJson = {
    gender?: 'men' | 'women' | 'kids' | 'unisex';
    limit?: number;
    daysAgo?: number;
};

type RawSection = Awaited<ReturnType<HomeRepository['findAllActive']>>[number];

export class HomeService {
    async getHome() {
        const sections = await homeRepository.findAllActive();

        const resolved = await Promise.all(
            sections.map((section) => this.resolveSection(section)),
        );

        return resolved;
    }

    async getSectionBySlug(slug: string) {
        const section = await homeRepository.findBySlug(slug);
        if (!section) {
            throw new NotFoundError('Seção não encontrada.');
        }

        return this.resolveSection(section);
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
     * Resolve o conteúdo de uma seção baseado no seu type.
     * category_list e banner retornam items vazio por ora.
     */
    private async resolveSection(section: RawSection) {
        const type = section.type as SectionType;
        const filter = (section.filterJson ?? {}) as SectionFilterJson;

        const productListTypes: SectionType[] = [
            'top_selling',
            'new_in',
            'on_sale',
            'free_shipping',
            'by_gender',
        ];

        if (productListTypes.includes(type)) {
            const items = await this.resolveProductList(type, filter);
            return { ...section, items };
        }

        return { ...section, items: [] };
    }

    /**
     * Executa a query de produtos baseado no type da seção.
     *
     * Cada type tem sua lógica de filtro e ordenação padrão.
     * O filterJson serve apenas para overrides (limit, gender, daysAgo).
     */
    private async resolveProductList(
        type: SectionType,
        filter: SectionFilterJson,
    ) {
        const limit = filter.limit ?? 10;

        const baseCondition = eq(products.status, 'active');
        const conditions = [baseCondition];

        let orderBy: SQL<unknown>[];

        switch (type) {
            case 'top_selling':
                orderBy = [desc(products.soldCount), desc(products.ratingAvg)];
                break;

            case 'new_in': {
                const daysAgo = filter.daysAgo ?? 30;
                const since = new Date();
                since.setDate(since.getDate() - daysAgo);
                conditions.push(gte(products.createdAt, since));
                orderBy = [desc(products.createdAt)];
                break;
            }

            case 'on_sale':
                conditions.push(isNotNull(products.originalPrice));
                orderBy = [desc(products.soldCount)];
                break;

            case 'free_shipping':
                conditions.push(eq(products.freeShipping, true));
                orderBy = [desc(products.ratingAvg), desc(products.soldCount)];
                break;

            case 'by_gender':
                if (filter.gender) {
                    conditions.push(eq(products.gender, filter.gender));
                }
                orderBy = [desc(products.soldCount), desc(products.ratingAvg)];
                break;

            default:
                orderBy = [desc(products.soldCount)];
        }

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
