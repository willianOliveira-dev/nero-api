import { NotFoundError } from '@/shared/errors/app.error';
import { serializeProductCard, type RawProductCardInput } from '@/modules/products/serializers/products.serializer';
import { WishlistRepository } from '../repositories/wishlist.repository';

const wishlistRepository = new WishlistRepository();

export class WishlistService {
	/**
	 * Adiciona um produto à wishlist padrão do usuário.
	 * Operação idempotente: se o produto já está na lista, retorna 200.
	 */
	async addProduct(userId: string, productId: string) {
		const product = await wishlistRepository.findProductById(productId);
		if (!product) {
			throw new NotFoundError('Produto');
		}

		const wishlist = await wishlistRepository.findOrCreateDefault(userId);
		const existing = await wishlistRepository.findItem(wishlist.id, productId);

		if (existing) {
			return { added: true, productId };
		}

		await wishlistRepository.addItem(wishlist.id, productId);
		return { added: true, productId };
	}

	/**
	 * Remove um produto da wishlist padrão do usuário.
	 */
	async removeProduct(userId: string, productId: string) {
		const wishlist = await wishlistRepository.findOrCreateDefault(userId);
		const removed = await wishlistRepository.removeItem(wishlist.id, productId);

		if (!removed) {
			throw new NotFoundError('Item na wishlist');
		}

		return { removed: true, productId };
	}

	/**
	 * Lista todos os produtos na wishlist padrão do usuário
	 * retornando os dados no formato ProductCard.
	 */
	async listProducts(userId: string) {
		const wishlist = await wishlistRepository.findOrCreateDefault(userId);
		const items = await wishlistRepository.listItems(wishlist.id);

		const productCards = items.map((item) =>
			serializeProductCard(item.product as RawProductCardInput),
		);

		return {
			items: productCards,
			total: productCards.length,
		};
	}

	/**
	 * Verifica se um produto está na wishlist de um usuário.
	 */
	async isWishlisted(userId: string, productId: string) {
		return wishlistRepository.isProductWishlisted(userId, productId);
	}
}
