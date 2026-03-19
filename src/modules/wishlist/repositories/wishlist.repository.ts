import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { wishlistItems, wishlists, products } from '@/lib/db/schemas/index.schema';

export class WishlistRepository {
	/**
	 * Busca ou cria a wishlist padrão do usuário.
	 */
	async findOrCreateDefault(userId: string) {
		let wishlist = await db.query.wishlists.findFirst({
			where: and(
				eq(wishlists.userId, userId),
				eq(wishlists.isDefault, true),
			),
		});

		if (!wishlist) {
			const [created] = await db
				.insert(wishlists)
				.values({ userId, name: 'Favoritos', isDefault: true })
				.returning();

			wishlist = created;
		}

		return wishlist;
	}

	/**
	 * Verifica se um produto já está na wishlist.
	 */
	async findItem(wishlistId: string, productId: string) {
		return (
			db.query.wishlistItems.findFirst({
				where: and(
					eq(wishlistItems.wishlistId, wishlistId),
					eq(wishlistItems.productId, productId),
				),
			}) ?? null
		);
	}

	/**
	 * Adiciona um produto à wishlist.
	 */
	async addItem(wishlistId: string, productId: string) {
		const [result] = await db
			.insert(wishlistItems)
			.values({ wishlistId, productId })
			.returning();

		return result;
	}

	/**
	 * Remove um produto da wishlist.
	 */
	async removeItem(wishlistId: string, productId: string) {
		const [result] = await db
			.delete(wishlistItems)
			.where(
				and(
					eq(wishlistItems.wishlistId, wishlistId),
					eq(wishlistItems.productId, productId),
				),
			)
			.returning();

		return result ?? null;
	}

	/**
	 * Lista todos os itens da wishlist com dados do produto para ProductCard.
	 */
	async listItems(wishlistId: string) {
		return db.query.wishlistItems.findMany({
			where: eq(wishlistItems.wishlistId, wishlistId),
			orderBy: (items, { desc }) => [desc(items.addedAt)],
			with: {
				product: {
					with: {
						brand: true,
						images: {
							where: (img: any, { eq }: any) =>
								eq(img.isPrimary, true),
							limit: 1,
						},
						skus: {
							columns: {
								price: true,
								isActive: true,
							},
						},
					},
				},
			},
		});
	}

	/**
	 * Verifica se o produto existe e está ativo.
	 */
	async findProductById(productId: string) {
		return (
			db.query.products.findFirst({
				where: eq(products.id, productId),
				columns: { id: true, status: true },
			}) ?? null
		);
	}

	/**
	 * Verifica se um produto está na wishlist de um usuário.
	 */
	async isProductWishlisted(userId: string, productId: string): Promise<boolean> {
		const wishlist = await db.query.wishlists.findFirst({
			where: and(
				eq(wishlists.userId, userId),
				eq(wishlists.isDefault, true),
			),
			columns: { id: true },
		});

		if (!wishlist) return false;

		const item = await db.query.wishlistItems.findFirst({
			where: and(
				eq(wishlistItems.wishlistId, wishlist.id),
				eq(wishlistItems.productId, productId),
			),
			columns: { id: true },
		});

		return !!item;
	}
}
