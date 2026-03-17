
import { Price } from '@/shared/utils/price.util';

export type RawBrand = {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
};

export type RawCategory = {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    parent?: { id: string; name: string; slug: string } | null;
};

export type RawImage = {
    id: string;
    url: string;
    altText: string | null;
    position: number;
    isPrimary: boolean;
    variantId: string | null;
};

export type RawVariant = {
    id: string;
    sku: string;
    gtin: string | null;
    stock: number;
    isActive: boolean;
    price: number | null;
    attributes: Record<string, string>;
    weightInGrams: number | null;
    lengthCm: string | null;
    widthCm: string | null;
    heightCm: string | null;
};

export type RawProduct = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    basePrice: number;
    originalPrice: number | null;
    gender: string;
    status: string;
    freeShipping: boolean;
    soldCount: number;
    ratingAvg: string | null;
    ratingCount: number;
    sizeChartUrl: string | null;
    categoryId: string | null;
    brandId: string | null;
    createdAt: Date;
    updatedAt: Date;
    brand?: RawBrand | null;
    category?: RawCategory | null;
    variants?: RawVariant[];
    images?: RawImage[];
};

export function serializeProductCard(product: RawProduct) {
    return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Price.toProductOutput(product.basePrice, product.originalPrice),
        brand: product.brand ? {
            name: product.brand.name,
            slug: product.brand.slug
        } : null,
        rating: {
            average: product.ratingAvg ? Number(product.ratingAvg) : 0,
            count: product.ratingCount
        },
        imageUrl: product.images?.find(i => i.isPrimary)?.url ?? product.images?.[0]?.url ?? null,
        freeShipping: product.freeShipping
    };
}

export function serializeProductList(products: RawProduct[]) {
    return products.map(serializeProductCard);
}

export function serializeProductDetail(product: RawProduct, isWishlisted = false) {
    const images = [...(product.images ?? [])].sort((a, b) => a.position - b.position);
    const variants = (product.variants ?? []).filter(v => v.isActive);

    const categories = [];
    if (product.category?.parent) {
        categories.push({ name: product.category.parent.name, slug: product.category.parent.slug });
    }
    if (product.category) {
        categories.push({ name: product.category.name, slug: product.category.slug });
    }

    return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        status: product.status,
        price: Price.toProductOutput(product.basePrice, product.originalPrice),
        brand: product.brand ? {
            name: product.brand.name,
            slug: product.brand.slug,
            logo: product.brand.logoUrl
        } : null,
        categories,
        images: images.filter(img => !img.variantId).map(img => ({
            id: img.id,
            url: img.url,
            alt: img.altText,
            isPrimary: img.isPrimary
        })),
        variants: variants.map(v => ({
            id: v.id,
            sku: v.sku,
            stock: v.stock,
            attributes: v.attributes,
            price: Price.toProductOutput(
                v.price ?? product.basePrice,
                v.price ? null : product.originalPrice
            ),
            images: images.filter(img => img.variantId === v.id).map(img => ({
                id: img.id,
                url: img.url,
                alt: img.altText
            }))
        })),
        rating: {
            average: product.ratingAvg ? Number(product.ratingAvg) : 0,
            count: product.ratingCount,
            sold: product.soldCount
        },
        features: {
            freeShipping: product.freeShipping,
            gender: product.gender,
            sizeChart: product.sizeChartUrl
        },
        userContext: {
            isWishlisted
        }
    };
}
