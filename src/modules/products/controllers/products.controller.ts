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
import {
    serializeProduct,
    serializeProductList,
    serializeVariant,
} from '../serializers/products.serializer';

import { ProductsService } from '../services/products.service';

const productsService = new ProductsService();

export class ProductsController {
    search: SearchProductsHandler = async (request, reply) => {
        const result = await productsService.search(request.query);

        const response = {
            data: serializeProductList(result.data),

            meta: {
                total: result.total,
                nextCursor: result.nextCursor,
                hasMore: result.hasMore,
                limit: request.query.limit,
            },
        };

        return reply.status(200).send(response);
    };

    getById: GetProductByIdHandler = async (request, reply) => {
        const product = await productsService.getById(request.params.id);

        return reply.status(200).send({
            data: serializeProduct(product),
        });
    };

    getBySlug: GetProductBySlugHandler = async (request, reply) => {
        const product = await productsService.getBySlug(request.params.slug);

        return reply.status(200).send({
            data: serializeProduct(product),
        });
    };

    create: CreateProductHandler = async (request, reply) => {
        const product = await productsService.create(request.body);

        return reply.status(201).send({
            data: serializeProduct(product),
        });
    };

    update: UpdateProductHandler = async (request, reply) => {
        const product = await productsService.update(
            request.params.id,
            request.body,
        );

        return reply.status(200).send({
            data: serializeProduct(product),
        });
    };

    archive: ArchiveProductHandler = async (request, reply) => {
        const product = await productsService.archive(request.params.id);

        return reply.status(200).send({
            data: serializeProduct(product),
        });
    };

    listVariants: ListVariantsHandler = async (request, reply) => {
        const variants = await productsService.listVariants(request.params.id);

        return reply.status(200).send({
            data: variants.map(serializeVariant),
        });
    };

    createVariant: CreateVariantHandler = async (request, reply) => {
        const variant = await productsService.createVariant(
            request.params.id,
            request.body,
        );

        return reply.status(201).send({
            data: serializeVariant(variant),
        });
    };

    updateVariant: UpdateVariantHandler = async (request, reply) => {
        const variant = await productsService.updateVariant(
            request.params.id,
            request.params.vid,
            request.body,
        );

        return reply.status(200).send({
            data: serializeVariant(variant),
        });
    };

    listImages: ListImagesHandler = async (request, reply) => {
        const images = await productsService.listImages(request.params.id);

        return reply.status(200).send({
            data: images,
        });
    };

    presignImage: PresignImageHandler = async (request, reply) => {
        const result = await productsService.presignImage(request.params.id);

        return reply.status(200).send({
            data: result,
        });
    };

    confirmImage: ConfirmImageHandler = async (request, reply) => {
        const image = await productsService.confirmImage(
            request.params.id,
            request.body,
        );

        return reply.status(201).send({
            data: image,
        });
    };

    updateImage: UpdateImageHandler = async (request, reply) => {
        const image = await productsService.updateImage(
            request.params.id,
            request.params.iid,
            request.body,
        );

        return reply.status(200).send({
            data: image,
        });
    };

    deleteImage: DeleteImageHandler = async (request, reply) => {
        const result = await productsService.deleteImage(
            request.params.id,
            request.params.iid,
        );

        return reply.status(200).send({
            data: result,
        });
    };

    reorderImages: ReorderImagesHandler = async (request, reply) => {
        const result = await productsService.reorderImages(
            request.params.id,
            request.body,
        );

        return reply.status(200).send({
            data: result,
        });
    };
}
