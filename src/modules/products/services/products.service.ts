import { StorageService } from '@/modules/storage/services/storage.service';
import { ConflictError, NotFoundError } from '@/shared/errors/app.error';
import { ProductsRepository } from '../repositories/products.repository';
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
    async getById(id: string) {
        const product = await productsRepository.findById(id);
        if (!product) {
            throw new NotFoundError('Produto não encontrado.');
        }
        return product;
    }

    async getBySlug(slug: string) {
        const product = await productsRepository.findBySlug(slug);
        if (!product) {
            throw new NotFoundError('Produto não encontrado.');
        }
        return product;
    }

    async search(filters: SearchProductsInput) {
        return productsRepository.search(filters);
    }

    async create(input: CreateProductInput) {
        return productsRepository.create(input);
    }

    async update(id: string, input: UpdateProductInput) {
        const existing = await productsRepository.findById(id);
        if (!existing) {
            throw new NotFoundError('Produto não encontrado.');
        }

        const updated = await productsRepository.update(id, input);
        if (!updated) {
            throw new NotFoundError('Produto não encontrado.');
        }

        return updated;
    }

    async archive(id: string) {
        const existing = await productsRepository.findById(id);
        if (!existing) {
            throw new NotFoundError('Produto não encontrado.');
        }

        const updated = await productsRepository.archive(id);
        if (!updated) {
            throw new NotFoundError('Produto não encontrado.');
        }

        return updated;
    }

    async listVariants(productId: string) {
        const product = await productsRepository.findById(productId);
        if (!product) {
            throw new NotFoundError('Produto não encontrado.');
        }

        return productsRepository.findVariantsByProductId(productId);
    }

    async createVariant(productId: string, input: CreateVariantInput) {
        const product = await productsRepository.findById(productId);
        if (!product) {
            throw new NotFoundError('Produto não encontrado.');
        }

        return productsRepository.createVariant(productId, input);
    }

    async updateVariant(
        productId: string,
        variantId: string,
        input: UpdateVariantInput,
    ) {
        const product = await productsRepository.findById(productId);
        if (!product) {
            throw new NotFoundError('Produto não encontrado.');
        }

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

    // ── Images ────────────────────────────────────────────────

    async listImages(productId: string) {
        const product = await productsRepository.findById(productId);
        if (!product) {
            throw new NotFoundError('Produto não encontrado.');
        }

        return productsRepository.findImagesByProductId(productId);
    }

    /**
     * Gera assinatura Cloudinary para upload direto de imagem de produto.
     */
    async presignImage(productId: string) {
        const product = await productsRepository.findById(productId);
        if (!product) {
            throw new NotFoundError('Produto não encontrado.');
        }

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

    /**
     * Salva imagem após upload confirmado pelo Cloudinary.
     */
    async confirmImage(productId: string, input: ConfirmProductImageInput) {
        const product = await productsRepository.findById(productId);
        if (!product) {
            throw new NotFoundError('Produto não encontrado.');
        }

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
        const product = await productsRepository.findById(productId);
        if (!product) {
            throw new NotFoundError('Produto não encontrado.');
        }

        await productsRepository.reorderImages(input.items);

        return { reordered: true };
    }
}
