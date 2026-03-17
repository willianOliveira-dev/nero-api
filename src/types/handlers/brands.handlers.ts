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
    BrandParams,
    BrandSlugParams,
    CreateBrandInput,
    UpdateBrandInput,
} from '../../modules/brands/validations/brands.validation';

type Handler<
    TParams = unknown,
    TBody = unknown,
    TQuery = unknown,
> = RouteHandlerMethod<
    RawServerDefault,
    RawRequestDefaultExpression,
    RawReplyDefaultExpression,
    { Params: TParams; Body: TBody; Querystring: TQuery; Reply: any },
    ContextConfigDefault,
    FastifySchema,
    ZodTypeProvider
>;

export type ListBrandsHandler = Handler;
export type GetBrandHandler = Handler<BrandSlugParams>;

export type CreateBrandHandler = Handler<unknown, CreateBrandInput>;
export type UpdateBrandHandler = Handler<BrandParams, UpdateBrandInput>;
export type DeleteBrandHandler = Handler<BrandParams>;
export type PresignBrandLogoHandler = Handler;
