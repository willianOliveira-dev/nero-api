import type { ZodHandler } from '@/types/handlers/root.handler';

import type {
    SerializedProduct,
    SerializedVariant,
} from '../../modules/products/serializers/products.serializer';

import type {
    ConfirmProductImageInput,
    CreateProductInput,
    CreateVariantInput,
    ImageParams,
    ProductParams,
    ProductSlugParams,
    ReorderImagesInput,
    SearchProductsInput,
    UpdateProductImageInput,
    UpdateProductInput,
    UpdateVariantInput,
    VariantParams,
} from '../../modules/products/validations/products.validation';

export type SearchProductsHandler = ZodHandler<
    unknown,
    unknown,
    SearchProductsInput,
    {
        data: SerializedProduct[];
        meta: {
            total: number;
            nextCursor: string | null;
            hasMore: boolean;
            limit: number;
        };
    }
>;

export type GetProductByIdHandler = ZodHandler<
    ProductParams,
    unknown,
    unknown,
    { data: SerializedProduct }
>;

export type GetProductBySlugHandler = ZodHandler<
    ProductSlugParams,
    unknown,
    unknown,
    { data: SerializedProduct }
>;

export type CreateProductHandler = ZodHandler<
    unknown,
    CreateProductInput,
    unknown,
    { data: SerializedProduct }
>;

export type UpdateProductHandler = ZodHandler<
    ProductParams,
    UpdateProductInput,
    unknown,
    { data: SerializedProduct }
>;

export type ArchiveProductHandler = ZodHandler<
    ProductParams,
    unknown,
    unknown,
    { data: SerializedProduct }
>;

export type ListVariantsHandler = ZodHandler<
    ProductParams,
    unknown,
    unknown,
    { data: SerializedVariant[] }
>;

export type CreateVariantHandler = ZodHandler<
    ProductParams,
    CreateVariantInput,
    unknown,
    { data: SerializedVariant }
>;

export type UpdateVariantHandler = ZodHandler<
    VariantParams,
    UpdateVariantInput,
    unknown,
    { data: SerializedVariant }
>;

export type ListImagesHandler = ZodHandler<
    ProductParams,
    unknown,
    unknown,
    { data: unknown[] }
>;

export type PresignImageHandler = ZodHandler<
    ProductParams,
    unknown,
    unknown,
    { data: unknown }
>;

export type ConfirmImageHandler = ZodHandler<
    ProductParams,
    ConfirmProductImageInput,
    unknown,
    { data: unknown }
>;

export type UpdateImageHandler = ZodHandler<
    ImageParams,
    UpdateProductImageInput,
    unknown,
    { data: unknown }
>;

export type DeleteImageHandler = ZodHandler<
    ImageParams,
    unknown,
    unknown,
    { data: { deleted: boolean } }
>;

export type ReorderImagesHandler = ZodHandler<
    ProductParams,
    ReorderImagesInput,
    unknown,
    { data: { reordered: boolean } }
>;
