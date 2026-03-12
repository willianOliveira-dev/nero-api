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
        items: SerializedProduct[];
        total: number;
        nextCursor: string | null;
        hasMore: boolean;
        limit: number;
    }
>;

export type GetProductByIdHandler = ZodHandler<
    ProductParams,
    unknown,
    unknown,
    SerializedProduct
>;

export type GetProductBySlugHandler = ZodHandler<
    ProductSlugParams,
    unknown,
    unknown,
    SerializedProduct
>;

export type CreateProductHandler = ZodHandler<
    unknown,
    CreateProductInput,
    unknown,
    SerializedProduct
>;

export type UpdateProductHandler = ZodHandler<
    ProductParams,
    UpdateProductInput,
    unknown,
    SerializedProduct
>;

export type ArchiveProductHandler = ZodHandler<
    ProductParams,
    unknown,
    unknown,
    SerializedProduct
>;

export type ListVariantsHandler = ZodHandler<
    ProductParams,
    unknown,
    unknown,
    SerializedVariant[]
>;

export type CreateVariantHandler = ZodHandler<
    ProductParams,
    CreateVariantInput,
    unknown,
    SerializedVariant
>;

export type UpdateVariantHandler = ZodHandler<
    VariantParams,
    UpdateVariantInput,
    unknown,
    SerializedVariant
>;

export type ListImagesHandler = ZodHandler<
    ProductParams,
    unknown
>;

export type PresignImageHandler = ZodHandler<
    ProductParams
>;

export type ConfirmImageHandler = ZodHandler<
    ProductParams,
    ConfirmProductImageInput
>;

export type UpdateImageHandler = ZodHandler<
    ImageParams,
    UpdateProductImageInput
>;

export type DeleteImageHandler = ZodHandler<
    ImageParams,
    unknown,
    unknown,
    { deleted: boolean }
>;

export type ReorderImagesHandler = ZodHandler<
    ProductParams,
    ReorderImagesInput,
    unknown,
    { reordered: boolean }
>;
