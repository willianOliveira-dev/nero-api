import type {
    CreateCategoryHandler,
    DeactivateCategoryHandler,
    GetCategoryBySlugHandler,
    ListCategoriesHandler,
    ReorderCategoriesHandler,
    UpdateCategoryHandler,
} from '../../../types/handlers/categories.handlers';
import { CategoriesService } from '../services/categories.service';

const categoriesService = new CategoriesService();

export class CategoriesController {
    list: ListCategoriesHandler = async (_request, reply) => {
        const categories = await categoriesService.listActive();

        return reply.status(200).send(categories);
    };

    getBySlug: GetCategoryBySlugHandler = async (request, reply) => {
        const category = await categoriesService.getBySlug(request.params.slug);

        return reply.status(200).send(category);
    };

    create: CreateCategoryHandler = async (request, reply) => {
        const category = await categoriesService.create(request.body);

        return reply.status(201).send(category);
    };

    update: UpdateCategoryHandler = async (request, reply) => {
        const category = await categoriesService.update(
            request.params.id,
            request.body,
        );

        return reply.status(200).send(category);
    };

    deactivate: DeactivateCategoryHandler = async (request, reply) => {
        const result = await categoriesService.deactivate(request.params.id);

        return reply.status(200).send(result);
    };

    reorder: ReorderCategoriesHandler = async (request, reply) => {
        const result = await categoriesService.reorder(request.body);

        return reply.status(200).send(result);
    };
}
