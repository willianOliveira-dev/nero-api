import type { RouteHandler } from 'fastify';
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

export type SearchProductsHandler = RouteHandler<{
    Querystring: SearchProductsInput;
    Reply: {
        data: SerializedProduct[];
        meta: {
            total: number;
            nextCursor: string | null;
            hasMore: boolean;
            limit: number;
        };
    };
}>;

export type GetProductByIdHandler = RouteHandler<{
    Params: ProductParams;
    Reply: { data: SerializedProduct };
}>;

export type GetProductBySlugHandler = RouteHandler<{
    Params: ProductSlugParams;
    Reply: { data: SerializedProduct };
}>;

export type CreateProductHandler = RouteHandler<{
    Body: CreateProductInput;
    Reply: { data: SerializedProduct };
}>;

export type UpdateProductHandler = RouteHandler<{
    Params: ProductParams;
    Body: UpdateProductInput;
    Reply: { data: SerializedProduct };
}>;

export type ArchiveProductHandler = RouteHandler<{
    Params: ProductParams;
    Reply: { data: SerializedProduct };
}>;

export type ListVariantsHandler = RouteHandler<{
    Params: ProductParams;
    Reply: { data: SerializedVariant[] };
}>;

export type CreateVariantHandler = RouteHandler<{
    Params: ProductParams;
    Body: CreateVariantInput;
    Reply: { data: SerializedVariant };
}>;

export type UpdateVariantHandler = RouteHandler<{
    Params: VariantParams;
    Body: UpdateVariantInput;
    Reply: { data: SerializedVariant };
}>;

export type ListImagesHandler = RouteHandler<{
    Params: ProductParams;
    Reply: { data: unknown[] };
}>;

export type PresignImageHandler = RouteHandler<{
    Params: ProductParams;
    Reply: { data: unknown };
}>;

export type ConfirmImageHandler = RouteHandler<{
    Params: ProductParams;
    Body: ConfirmProductImageInput;
    Reply: { data: unknown };
}>;

export type UpdateImageHandler = RouteHandler<{
    Params: ImageParams;
    Body: UpdateProductImageInput;
    Reply: { data: unknown };
}>;

export type DeleteImageHandler = RouteHandler<{
    Params: ImageParams;
    Reply: { data: { deleted: boolean } };
}>;

export type ReorderImagesHandler = RouteHandler<{
    Params: ProductParams;
    Body: ReorderImagesInput;
    Reply: { data: { reordered: boolean } };
}>;
