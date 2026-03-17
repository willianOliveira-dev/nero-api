import { BrandsService } from '../services/brands.service';
import type {
    CreateBrandHandler,
    DeleteBrandHandler,
    GetBrandHandler,
    ListBrandsHandler,
    PresignBrandLogoHandler,
    UpdateBrandHandler,
} from '../../../types/handlers/brands.handlers';

const brandsService = new BrandsService();

export const listBrandsHandler: ListBrandsHandler = async (_request, reply) => {
    const brands = await brandsService.listAll();
    return reply.status(200).send({ data: brands });
};

export const getBrandBySlugHandler: GetBrandHandler = async (request, reply) => {
    const brand = await brandsService.getBySlug(request.params.slug);
    return reply.status(200).send({ data: brand });
};

export const createBrandHandler: CreateBrandHandler = async (request, reply) => {
    const brand = await brandsService.create(request.body);
    return reply.status(201).send({ data: brand });
};

export const updateBrandHandler: UpdateBrandHandler = async (request, reply) => {
    const brand = await brandsService.update(request.params.id, request.body);
    return reply.status(200).send({ data: brand });
};

export const deleteBrandHandler: DeleteBrandHandler = async (request, reply) => {
    const brand = await brandsService.delete(request.params.id);
    return reply.status(200).send({ data: brand });
};

export const presignLogoHandler: PresignBrandLogoHandler = async (_request, reply) => {
    const result = await brandsService.presignLogo();
    return reply.status(200).send({ data: result });
};
