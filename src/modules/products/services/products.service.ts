import { StorageService } from '@/modules/storage/services/storage.service';
import { ConflictError, NotFoundError, BadRequestError } from '@/shared/errors/app.error';
import { ProductsRepository } from '../repositories/products.repository';
import {
	serializeProductDetail,
	serializeProductList,
} from '../serializers/products.serializer';
import type {
	ConfirmProductImageInput,
	CreateProductInput,
	ReorderImagesInput,
	SearchProductsInput,
	UpdateProductImageInput,
	UpdateProductInput,
	UpdateSkuInput,
} from '../validations/products.validation';

const productsRepository = new ProductsRepository();
const storageService = new StorageService();

export class ProductsService {
	async getBySlug(slug: string, userId?: string) {
		const result = await productsRepository.findBySlug(slug, userId);
		if (!result) {
			throw new NotFoundError('Produto não encontrado.');
		}

		const { isWishlisted, ...product } = result;
		return serializeProductDetail(product, isWishlisted);
	}

	async search(filters: SearchProductsInput) {
		const result = await productsRepository.search(filters);
		return {
			items: serializeProductList(result.data),
			total: result.total,
			nextCursor: result.nextCursor,
			hasMore: result.hasMore,
		};
	}

	async getById(id: string) {
		const product = await productsRepository.findById(id);
		if (!product) {
			throw new NotFoundError('Produto não encontrado.');
		}
		return serializeProductDetail(product);
	}

	async create(input: CreateProductInput) {
		if (input.variationTypes?.length && !input.skus?.length) {
			throw new BadRequestError(
				'SKUs são obrigatórios quando existem variações.',
			);
		}
		if (input.skus?.length && !input.variationTypes?.length) {
			throw new BadRequestError(
				'Variações são obrigatórias quando existem SKUs.',
			);
		}

		if (!input.variationTypes?.length) {
			if (input.price == null) {
				throw new BadRequestError(
					'Preço é obrigatório para produto simples.',
				);
			}
		}

		const product = await productsRepository.create(input);
		return productsRepository.findById(product.id);
	}

	async update(id: string, input: UpdateProductInput) {
		await this.findOrFail(id);
		const updated = await productsRepository.update(id, input);
		if (!updated) {
			throw new NotFoundError('Produto não encontrado.');
		}
		return productsRepository.findById(updated.id);
	}

	async archive(id: string) {
		await this.findOrFail(id);
		const updated = await productsRepository.archive(id);
		if (!updated) {
			throw new NotFoundError('Produto não encontrado.');
		}
		return updated;
	}

	

	async updateSku(productId: string, skuId: string, input: UpdateSkuInput) {
		await this.findOrFail(productId);

		const sku = await productsRepository.findSkuById(skuId);
		if (!sku || sku.productId !== productId) {
			throw new NotFoundError('SKU não encontrado.');
		}

		const updated = await productsRepository.updateSku(skuId, input);
		if (!updated) {
			throw new NotFoundError('SKU não encontrado.');
		}

		return updated;
	}
	async listImages(productId: string) {
		await this.findOrFail(productId);
		return productsRepository.findImagesByProductId(productId);
	}

	async presignImage(productId: string) {
		await this.findOrFail(productId);

		const count = await productsRepository.countImagesByProductId(
			productId,
		);
		if (count >= 5) {
			throw new ConflictError(
				'Limite de 5 imagens por produto atingido.',
			);
		}

		return storageService.generateUploadSignature(
			'products',
			`product_${productId}_${Date.now()}`,
		);
	}

	async confirmImage(productId: string, input: ConfirmProductImageInput) {
		await this.findOrFail(productId);

		const count = await productsRepository.countImagesByProductId(
			productId,
		);
		if (count >= 5) {
			throw new ConflictError(
				'Limite de 5 imagens por produto atingido.',
			);
		}

		return productsRepository.createImage(productId, input);
	}

	async updateImage(
		productId: string,
		imageId: string,
		input: UpdateProductImageInput,
	) {
		const images = await productsRepository.findImagesByProductId(
			productId,
		);
		const image = images.find((i) => i.id === imageId);
		if (!image) {
			throw new NotFoundError('Imagem não encontrada.');
		}

		const updated = await productsRepository.updateImage(imageId, input);
		if (!updated) {
			throw new NotFoundError('Imagem não encontrada.');
		}

		return updated;
	}

	async deleteImage(productId: string, imageId: string) {
		const images = await productsRepository.findImagesByProductId(
			productId,
		);
		const image = images.find((i) => i.id === imageId);
		if (!image) {
			throw new NotFoundError('Imagem não encontrada.');
		}

		const publicId = storageService.extractPublicIdFromUrl(image.url);
		if (publicId) {
			await storageService.deleteFile(publicId).catch(() => null);
		}

		await productsRepository.deleteImage(imageId);
		return { deleted: true };
	}

	async reorderImages(productId: string, input: ReorderImagesInput) {
		await this.findOrFail(productId);
		await productsRepository.reorderImages(input.items);
		return { reordered: true };
	}


	private async findOrFail(id: string) {
		const product = await productsRepository.findById(id);
		if (!product) {
			throw new NotFoundError('Produto não encontrado.');
		}
		return product;
	}
}
