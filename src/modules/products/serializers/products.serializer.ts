import type {
    PriceOutput,
    ProductPriceOutput,
} from '@/shared/utils/price.util';
import { Price } from '@/shared/utils/price.util';

type RawVariant = {
    id: string;
    productId: string;
    sku: string;
    price: string | null;
    stock: number;
    attributes: Record<string, string | undefined>;
    isActive: boolean;
};

type RawProduct = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    basePrice: string;
    originalPrice: string | null;
    gender: string;
    status: string;
    freeShipping: boolean;
    isFeatured: boolean;
    soldCount: number;
    ratingAvg: string | null;
    ratingCount: number;
    categoryId: string | null;
    createdAt: Date;
    updatedAt: Date;
    category?: unknown;
    variants?: RawVariant[];
    images?: unknown[];
};

export type SerializedVariant = {
    id: string;
    productId: string;
    sku: string;
    price: PriceOutput | null;
    stock: number;
    attributes: Record<string, string>;
    isActive: boolean;
};

export type SerializedProduct = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: ProductPriceOutput;
    gender: string;
    status: string;
    freeShipping: boolean;
    isFeatured: boolean;
    soldCount: number;
    ratingAvg: number | null;
    ratingCount: number;
    categoryId: string | null;
    category: unknown;
    variants: SerializedVariant[];
    images: unknown[];
    createdAt: Date;
    updatedAt: Date;
};

function clearAttributes(
    attrs: Record<string, string | undefined>,
): Record<string, string> {
    return Object.fromEntries(
        Object.entries(attrs).filter(([, value]) => value !== undefined),
    ) as Record<string, string>;
}

export function serializeVariant(variant: RawVariant): SerializedVariant {
    return {
        id: variant.id,
        productId: variant.productId,
        sku: variant.sku,
        price: variant.price ? Price.toOutput(variant.price) : null,
        stock: variant.stock,
        attributes: clearAttributes(variant.attributes),
        isActive: variant.isActive,
    };
}

export function serializeProduct(product: RawProduct): SerializedProduct {
    return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: Price.toProductOutput(product.basePrice, product.originalPrice),
        gender: product.gender,
        status: product.status,
        freeShipping: product.freeShipping,
        isFeatured: product.isFeatured,
        soldCount: product.soldCount,
        ratingAvg: product.ratingAvg ? Number(product.ratingAvg) : null,
        ratingCount: product.ratingCount,
        categoryId: product.categoryId,
        category: product.category ?? null,
        variants: product.variants?.map(serializeVariant) ?? [],
        images: product.images ?? [],
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    };
}

export function serializeProductList(
    products: RawProduct[],
): SerializedProduct[] {
    return products.map(serializeProduct);
}