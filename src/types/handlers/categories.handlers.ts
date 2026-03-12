import type { RouteHandler } from 'fastify';

import type {
    CreateCategoryInput,
    ReorderCategoriesInput,
    UpdateCategoryInput,
} from '../../modules/categories/validations/categories.validation';

export type ListCategoriesHandler = RouteHandler;

export type GetCategoryBySlugHandler = RouteHandler<{
    Params: {
        slug: string;
    };
}>;

export type CreateCategoryHandler = RouteHandler<{
    Body: CreateCategoryInput;
}>;

export type UpdateCategoryHandler = RouteHandler<{
    Params: {
        id: string;
    };
    Body: UpdateCategoryInput;
}>;

export type DeactivateCategoryHandler = RouteHandler<{
    Params: {
        id: string;
    };
}>;

export type ReorderCategoriesHandler = RouteHandler<{
    Body: ReorderCategoriesInput;
}>;
