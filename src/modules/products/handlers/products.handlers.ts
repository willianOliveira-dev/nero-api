import type {
	ArchiveProductHandler,
	ConfirmImageHandler,
	CreateProductHandler,
	DeleteImageHandler,
	GetProductByIdHandler,
	GetProductBySlugHandler,
	ListImagesHandler,
	PresignImageHandler,
	ReorderImagesHandler,
	SearchProductsHandler,
	UpdateImageHandler,
	UpdateProductHandler,
	UpdateSkuHandler,
} from '../../../types/handlers/products.handlers';
import { ProductsService } from '../services/products.service';

const productsService = new ProductsService();

export const searchProductsHandler: SearchProductsHandler = async (request, reply) => {
	const userId = request.session?.user?.id;
	const result = await productsService.search(request.query, userId);
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

export const updateSkuHandler: UpdateSkuHandler = async (request, reply) => {
	const sku = await productsService.updateSku(
		request.params.id,
		request.params.skuId,
		request.body,
	);
	return reply.status(200).send(sku);
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
