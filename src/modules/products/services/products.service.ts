import { StorageService } from '@/modules/storage/services/storage.service';
import { ConflictError, NotFoundError } from '@/shared/errors/app.error';
import { ProductsRepository } from '../repositories/products.repository';
import {
    serializeProductCard,
    serializeProductDetail,
    serializeProductList,
} from '../serializers/products.serializer';
import type {
    ConfirmProductImageInput,
    CreateProductInput,
    CreateVariantInput,
    ReorderImagesInput,
    SearchProductsInput,
    UpdateProductImageInput,
    UpdateProductInput,
    UpdateVariantInput,
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
        return serializeProductCard(product);
    }

    async create(input: CreateProductInput) {
        return productsRepository.create(input);
    }

    async update(id: string, input: UpdateProductInput) {
        await this.findOrFail(id);
        const updated = await productsRepository.update(id, input);
        if (!updated) {
            throw new NotFoundError('Produto não encontrado.');
        }
        return updated;
    }

    async archive(id: string) {
        await this.findOrFail(id);
        const updated = await productsRepository.archive(id);
        if (!updated) {
            throw new NotFoundError('Produto não encontrado.');
        }
        return updated;
    }

    async listVariants(productId: string) {
        await this.findOrFail(productId);
        return productsRepository.findVariantsByProductId(productId);
    }

    async createVariant(productId: string, input: CreateVariantInput) {
        await this.findOrFail(productId);
        return productsRepository.createVariant(productId, input);
    }

    async updateVariant(
        productId: string,
        variantId: string,
        input: UpdateVariantInput,
    ) {
        await this.findOrFail(productId);

        const variant = await productsRepository.findVariantById(variantId);
        if (!variant || variant.productId !== productId) {
            throw new NotFoundError('Variante não encontrada.');
        }

        const updated = await productsRepository.updateVariant(
            variantId,
            input,
        );
        if (!updated) {
            throw new NotFoundError('Variante não encontrada.');
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
