import { CategoriesService } from '../services/categories.service';
import type {
    CreateCategoryHandler,
    DeactivateCategoryHandler,
    GetCategoryBySlugHandler,
    ListCategoriesHandler,
    PresignCategoryImageHandler,
    ReorderCategoriesHandler,
    UpdateCategoryHandler,
} from '../../../types/handlers/categories.handlers';

const categoriesService = new CategoriesService();

export const listCategoriesHandler: ListCategoriesHandler = async (_request, reply) => {
    const categories = await categoriesService.listActive();
    return reply.status(200).send(categories);
};

export const getCategoryBySlugHandler: GetCategoryBySlugHandler = async (request, reply) => {
    const category = await categoriesService.getBySlug(request.params.slug);
    return reply.status(200).send(category);
};

export const createCategoryHandler: CreateCategoryHandler = async (request, reply) => {
    const category = await categoriesService.create(request.body);
    return reply.status(201).send(category);
};

export const updateCategoryHandler: UpdateCategoryHandler = async (request, reply) => {
    const category = await categoriesService.update(
        request.params.id,
        request.body,
    );
    return reply.status(200).send(category);
};

export const deactivateCategoryHandler: DeactivateCategoryHandler = async (request, reply) => {
    const result = await categoriesService.deactivate(request.params.id);
    return reply.status(200).send(result);
};

export const reorderCategoriesHandler: ReorderCategoriesHandler = async (request, reply) => {
    const result = await categoriesService.reorder(request.body);
    return reply.status(200).send(result);
};

export const presignImageHandler: PresignCategoryImageHandler = async (_request, reply) => {
    const result = await categoriesService.presignImage();
    return reply.status(200).send({ data: result });
};
