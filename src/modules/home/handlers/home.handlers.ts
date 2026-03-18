import { HomeService } from '../services/home.service';
import type {
    CreateHomeSectionHandler,
    DeleteHomeSectionHandler,
    GetHomeHandler,
    GetHomeSectionHandler,
    ListHomeSectionsHandler,
    ReorderHomeSectionsHandler,
    UpdateHomeSectionHandler,
} from '../../../types/handlers/home.handlers';

const homeService = new HomeService();

export const getHomeHandler: GetHomeHandler = async (request, reply) => {
    const { gender } = request.query;
    const sections = await homeService.getHome(gender);
    return reply.status(200).send(sections);
};

export const getHomeSectionHandler: GetHomeSectionHandler = async (request, reply) => {
    const section = await homeService.getSectionBySlug(request.params.id);
    return reply.status(200).send(section);
};

export const listHomeSectionsHandler: ListHomeSectionsHandler = async (_request, reply) => {
    const sections = await homeService.listAll();
    return reply.status(200).send(sections);
};

export const createHomeSectionHandler: CreateHomeSectionHandler = async (request, reply) => {
    const section = await homeService.create(request.body);
    return reply.status(201).send(section);
};

export const updateHomeSectionHandler: UpdateHomeSectionHandler = async (request, reply) => {
    const section = await homeService.update(
        request.params.id,
        request.body,
    );
    return reply.status(200).send(section);
};

export const deleteHomeSectionHandler: DeleteHomeSectionHandler = async (request, reply) => {
    await homeService.delete(request.params.id);
    return reply.status(200).send({ deleted: true });
};

export const reorderHomeSectionsHandler: ReorderHomeSectionsHandler = async (request, reply) => {
    const result = await homeService.reorder(request.body);
    return reply.status(200).send(result);
};
