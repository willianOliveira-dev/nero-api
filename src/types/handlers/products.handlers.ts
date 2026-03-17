import type {
    ContextConfigDefault,
    FastifySchema,
    RawReplyDefaultExpression,
    RawRequestDefaultExpression,
    RawServerDefault,
    RouteHandlerMethod,
} from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
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

type Handler<TParams = unknown, TBody = unknown, TQuery = unknown> = RouteHandlerMethod<
    RawServerDefault,
    RawRequestDefaultExpression,
    RawReplyDefaultExpression,
    { Params: TParams; Body: TBody; Querystring: TQuery; Reply: any },
    ContextConfigDefault,
    FastifySchema,
    ZodTypeProvider
>;

type ReviewsQuery = { limit: number; cursor?: string };

export type SearchProductsHandler    = Handler<unknown, unknown, SearchProductsInput>;
export type GetProductBySlugHandler  = Handler<ProductSlugParams>;
export type GetProductByIdHandler    = Handler<ProductParams>;
export type GetProductReviewsHandler = Handler<ProductParams, unknown, ReviewsQuery>;
export type ListVariantsHandler      = Handler<ProductParams>;
export type ListImagesHandler        = Handler<ProductParams>;

// Admin
export type CreateProductHandler  = Handler<unknown, CreateProductInput>;
export type UpdateProductHandler  = Handler<ProductParams, UpdateProductInput>;
export type ArchiveProductHandler = Handler<ProductParams>;
export type CreateVariantHandler  = Handler<ProductParams, CreateVariantInput>;
export type UpdateVariantHandler  = Handler<VariantParams, UpdateVariantInput>;
export type PresignImageHandler   = Handler<ProductParams>;
export type ConfirmImageHandler   = Handler<ProductParams, ConfirmProductImageInput>;
export type UpdateImageHandler    = Handler<ImageParams, UpdateProductImageInput>;
export type DeleteImageHandler    = Handler<ImageParams>;
export type ReorderImagesHandler  = Handler<ProductParams, ReorderImagesInput>;