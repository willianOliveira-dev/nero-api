import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { cartItems, carts, coupons, productSkus, products } from '@/lib/db/schemas/index.schema';

export class CartRepository {
	/**
	 * Busca o carrinho ativo do usuário com itens, produtos e SKUs.
	 * Cria automaticamente se não existir (lazy creation).
	 */
	async findOrCreateByUserId(userId: string) {
		const cartQuery = {
			coupon: true,
			items: {
				with: {
					product: {
						with: {
							images: {
								where: (img: any, { eq }: any) =>
									eq(img.isPrimary, true),
								limit: 1,
							},
						},
					},
					sku: {
						with: {
							optionMappings: {
								with: {
									variationOption: {
										with: {
											variationType: {
												columns: { id: true, name: true },
											},
										},
									},
								},
							},
						},
					},
				},
			},
		} as const;

		let cart = await db.query.carts.findFirst({
			where: eq(carts.userId, userId),
			with: cartQuery,
		});

		if (!cart) {
			const [created] = await db
				.insert(carts)
				.values({ userId })
				.returning();

			cart = await db.query.carts.findFirst({
				where: eq(carts.id, created.id),
				with: cartQuery,
			});
		}

		return cart;
	}

	async findById(cartId: string) {
		return (
			db.query.carts.findFirst({
				where: eq(carts.id, cartId),
				with: { items: true },
			}) ?? null
		);
	}

	/**
	 * Busca um item do carrinho pelo ID garantindo que pertence ao carrinho.
	 */
	async findItem(itemId: string, cartId: string) {
		return (
			db.query.cartItems.findFirst({
				where: and(
					eq(cartItems.id, itemId),
					eq(cartItems.cartId, cartId),
				),
				with: {
					sku: true,
				},
			}) ?? null
		);
	}

	/**
	 * Busca item existente pelo productId + skuId para evitar duplicatas.
	 */
	async findItemByProduct(
		cartId: string,
		productId: string,
		skuId?: string | null,
	) {
		const conditions = [
			eq(cartItems.cartId, cartId),
			eq(cartItems.productId, productId),
		];

		if (skuId) {
			conditions.push(eq(cartItems.skuId, skuId));
		}

		return (
			db.query.cartItems.findFirst({
				where: and(...conditions),
			}) ?? null
		);
	}

	/**
	 * Busca o SKU pelo ID para validação de estoque.
	 */
	async findSkuById(skuId: string) {
		return (
			db.query.productSkus.findFirst({
				where: eq(productSkus.id, skuId),
			}) ?? null
		);
	}

	/**
	 * Busca o produto para resolver preço de produto simples.
	 */
	async findProductById(productId: string) {
		return (
			db.query.products.findFirst({
				where: eq(products.id, productId),
				columns: {
					id: true,
					price: true,
					stock: true,
					hasVariations: true,
				},
			}) ?? null
		);
	}

	async addItem(data: {
		cartId: string;
		productId: string;
		skuId?: string | null;
		quantity: number;
		priceSnapshot: string;
	}) {
		const [result] = await db.insert(cartItems).values(data).returning();
		return result;
	}

	async updateItemQuantity(itemId: string, quantity: number) {
		const [result] = await db
			.update(cartItems)
			.set({ quantity })
			.where(eq(cartItems.id, itemId))
			.returning();

		return result ?? null;
	}

	async removeItem(itemId: string) {
		const [result] = await db
			.delete(cartItems)
			.where(eq(cartItems.id, itemId))
			.returning();

		return result ?? null;
	}

	async clearItems(cartId: string) {
		await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
	}

	/**
	 * Atualiza os totais calculados do carrinho.
	 */
	async updateTotals(
		cartId: string,
		data: {
			subtotal: string;
			shippingCost: string;
			taxAmount: string;
			total: string;
			couponId?: string | null;
		},
	) {
		const [result] = await db
			.update(carts)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(carts.id, cartId))
			.returning();

		return result ?? null;
	}

	async applyCoupon(cartId: string, couponId: string) {
		const [result] = await db
			.update(carts)
			.set({ couponId, updatedAt: new Date() })
			.where(eq(carts.id, cartId))
			.returning();

		return result ?? null;
	}

	async removeCoupon(cartId: string) {
		const [result] = await db
			.update(carts)
			.set({ couponId: null, updatedAt: new Date() })
			.where(eq(carts.id, cartId))
			.returning();

		return result ?? null;
	}

	async findCouponByCode(code: string) {
		return (
			db.query.coupons.findFirst({
				where: and(eq(coupons.code, code), eq(coupons.isActive, true)),
			}) ?? null
		);
	}
}
