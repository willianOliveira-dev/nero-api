import type {
    CreateHomeSectionHandler,
    DeleteHomeSectionHandler,
    GetHomeHandler,
    GetHomeSectionHandler,
    ListHomeSectionsHandler,
    ReorderHomeSectionsHandler,
    UpdateHomeSectionHandler,
} from '../../../types/handlers/home.handlers';
import { HomeService } from '../services/home.service';

const homeService = new HomeService();

export class HomeController {
    getHome: GetHomeHandler = async (_request, reply) => {
        const sections = await homeService.getHome();
        return reply.status(200).send({ data: sections });
    };

    getSection: GetHomeSectionHandler = async (request, reply) => {
        const section = await homeService.getSectionBySlug(request.params.id);
        return reply.status(200).send({ data: section });
    };

    listAll: ListHomeSectionsHandler = async (_request, reply) => {
        const sections = await homeService.listAll();
        return reply.status(200).send({ data: sections });
    };

    create: CreateHomeSectionHandler = async (request, reply) => {
        const section = await homeService.create(request.body);
        return reply.status(201).send({ data: section });
    };

    update: UpdateHomeSectionHandler = async (request, reply) => {
        const section = await homeService.update(
            request.params.id,
            request.body,
        );
        return reply.status(200).send({ data: section });
    };

    delete: DeleteHomeSectionHandler = async (request, reply) => {
        const result = await homeService.delete(request.params.id);
        return reply.status(200).send({ data: result });
    };

    reorder: ReorderHomeSectionsHandler = async (request, reply) => {
        const result = await homeService.reorder(request.body);
        return reply.status(200).send({ data: result });
    };
}
