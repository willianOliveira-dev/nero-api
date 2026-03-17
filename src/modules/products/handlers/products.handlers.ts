import type {
    ArchiveProductHandler,
    ConfirmImageHandler,
    CreateProductHandler,
    CreateVariantHandler,
    DeleteImageHandler,
    GetProductByIdHandler,
    GetProductBySlugHandler,
    ListImagesHandler,
    ListVariantsHandler,
    PresignImageHandler,
    ReorderImagesHandler,
    SearchProductsHandler,
    UpdateImageHandler,
    UpdateProductHandler,
    UpdateVariantHandler,
} from '../../../types/handlers/products.handlers';
import { ProductsService } from '../services/products.service';

const productsService = new ProductsService();

export const searchProductsHandler: SearchProductsHandler = async (request, reply) => {
    const result = await productsService.search(request.query);
    return reply.status(200).send(result);
};

export const getProductBySlugHandler: GetProductBySlugHandler = async (request, reply) => {
    const userId = request.session?.user?.id;
    const result = await productsService.getBySlug(
        request.params.slug,
        userId,
    );
    return reply.status(200).send(result);
};

export const getProductByIdHandler: GetProductByIdHandler = async (request, reply) => {
    const result = await productsService.getById(request.params.id);
    return reply.status(200).send(result);
};

export const createProductHandler: CreateProductHandler = async (request, reply) => {
    const product = await productsService.create(request.body);
    return reply.status(201).send(product);
};

export const updateProductHandler: UpdateProductHandler = async (request, reply) => {
    const product = await productsService.update(
        request.params.id,
        request.body,
    );
    return reply.status(200).send(product);
};

export const archiveProductHandler: ArchiveProductHandler = async (request, reply) => {
    const product = await productsService.archive(request.params.id);
    return reply.status(200).send(product);
};

export const listVariantsHandler: ListVariantsHandler = async (request, reply) => {
    const variants = await productsService.listVariants(request.params.id);
    return reply.status(200).send(variants);
};

export const createVariantHandler: CreateVariantHandler = async (request, reply) => {
    const variant = await productsService.createVariant(
        request.params.id,
        request.body,
    );
    return reply.status(201).send(variant);
};

export const updateVariantHandler: UpdateVariantHandler = async (request, reply) => {
    const variant = await productsService.updateVariant(
        request.params.id,
        request.params.vid,
        request.body,
    );
    return reply.status(200).send(variant);
};

export const listImagesHandler: ListImagesHandler = async (request, reply) => {
    const images = await productsService.listImages(request.params.id);
    return reply.status(200).send(images);
};

export const presignImageHandler: PresignImageHandler = async (request, reply) => {
    const result = await productsService.presignImage(request.params.id);
    return reply.status(200).send(result);
};

export const confirmImageHandler: ConfirmImageHandler = async (request, reply) => {
    const image = await productsService.confirmImage(
        request.params.id,
        request.body,
    );
    return reply.status(201).send(image);
};

export const updateImageHandler: UpdateImageHandler = async (request, reply) => {
    const image = await productsService.updateImage(
        request.params.id,
        request.params.iid,
        request.body,
    );
    return reply.status(200).send(image);
};

export const deleteImageHandler: DeleteImageHandler = async (request, reply) => {
    const result = await productsService.deleteImage(
        request.params.id,
        request.params.iid,
    );
    return reply.status(200).send(result);
};

export const reorderImagesHandler: ReorderImagesHandler = async (request, reply) => {
    const result = await productsService.reorderImages(
        request.params.id,
        request.body,
    );
    return reply.status(200).send(result);
};
