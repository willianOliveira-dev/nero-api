import { BadRequestError, NotFoundError } from '@/shared/errors/app.error';
import { Price } from '@/shared/utils/price.util';
import { CartRepository } from '../repositories/cart.repository';
import type {
	AddCartItemInput,
	UpdateCartItemInput,
} from '../validations/cart.validation';

const cartRepository = new CartRepository();

type LoadedCart = NonNullable<
	Awaited<ReturnType<CartRepository['findOrCreateByUserId']>>
>;

export class CartService {
	/**
	 * Helper central — garante que o carrinho sempre existe e está carregado.
	 */
	private async getOrCreate(userId: string): Promise<LoadedCart> {
		const cart = await cartRepository.findOrCreateByUserId(userId);
		if (!cart) {
			throw new Error('Falha ao criar carrinho.');
		}
		return cart;
	}

	async getCart(userId: string) {
		const cart = await this.getOrCreate(userId);
		return this.serializeCart(cart);
	}

	async addItem(userId: string, input: AddCartItemInput) {
		const cart = await this.getOrCreate(userId);

		const availableStock = await this.getAvailableStock(
			input.productId,
			input.skuId,
		);

		const existing = await cartRepository.findItemByProduct(
			cart.id,
			input.productId,
			input.skuId,
		);

		const currentQuantity = existing?.quantity ?? 0;
		const totalQuantity = currentQuantity + input.quantity;

		if (totalQuantity > availableStock) {
			throw new BadRequestError(
				`Estoque insuficiente. Disponível: ${availableStock}, solicitado: ${totalQuantity}.`,
			);
		}

		if (existing) {
			await cartRepository.updateItemQuantity(
				existing.id,
				totalQuantity,
			);
		} else {
			const priceSnapshot = await this.resolvePriceSnapshot(
				input.productId,
				input.skuId,
			);
			await cartRepository.addItem({
				cartId: cart.id,
				productId: input.productId,
				skuId: input.skuId,
				quantity: input.quantity,
				priceSnapshot,
			});
		}

		return this.refreshAndSerialize(userId, cart.id);
	}

	async updateItem(
		userId: string,
		itemId: string,
		input: UpdateCartItemInput,
	) {
		const cart = await this.getOrCreate(userId);
		const item = await cartRepository.findItem(itemId, cart.id);

		if (!item) {
			throw new NotFoundError('Item não encontrado no carrinho.');
		}

		const availableStock = await this.getAvailableStock(
			item.productId,
			item.skuId,
		);

		if (input.quantity > availableStock) {
			throw new BadRequestError(
				`Estoque insuficiente. Disponível: ${availableStock}, solicitado: ${input.quantity}.`,
			);
		}

		await cartRepository.updateItemQuantity(itemId, input.quantity);

		return this.refreshAndSerialize(userId, cart.id);
	}

	async removeItem(userId: string, itemId: string) {
		const cart = await this.getOrCreate(userId);
		const item = await cartRepository.findItem(itemId, cart.id);

		if (!item) {
			throw new NotFoundError('Item não encontrado no carrinho.');
		}

		await cartRepository.removeItem(itemId);

		return this.refreshAndSerialize(userId, cart.id);
	}

	async applyCoupon(userId: string, code: string) {
		const cart = await this.getOrCreate(userId);
		const coupon = await cartRepository.findCouponByCode(code);

		if (!coupon) {
			throw new BadRequestError('Cupom inválido ou inativo.');
		}

		if (coupon.expiresAt && new Date() > coupon.expiresAt) {
			throw new BadRequestError('Cupom expirado.');
		}

		if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
			throw new BadRequestError('Cupom esgotado.');
		}

		if (
			coupon.minOrderValue &&
			Number(cart.subtotal) < Number(coupon.minOrderValue)
		) {
			const min = Price.format(String(coupon.minOrderValue));
			throw new BadRequestError(
				`Pedido mínimo de ${min} para usar este cupom.`,
			);
		}

		await cartRepository.applyCoupon(cart.id, coupon.id);

		return this.refreshAndSerialize(userId, cart.id);
	}

	async removeCoupon(userId: string) {
		const cart = await this.getOrCreate(userId);
		await cartRepository.removeCoupon(cart.id);
		return this.refreshAndSerialize(userId, cart.id);
	}

	async validateCoupon(code: string, userId: string) {
		const cart = await this.getOrCreate(userId);
		const coupon = await cartRepository.findCouponByCode(code);

		if (!coupon) {
			throw new BadRequestError('Cupom inválido ou inativo.');
		}
		if (coupon.expiresAt && new Date() > coupon.expiresAt) {
			throw new BadRequestError('Cupom expirado.');
		}
		if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
			throw new BadRequestError('Cupom esgotado.');
		}

		if (
			coupon.minOrderValue &&
			Number(cart.subtotal) < Number(coupon.minOrderValue)
		) {
			const min = Price.format(String(coupon.minOrderValue));
			throw new BadRequestError(
				`Pedido mínimo de ${min} para usar este cupom.`,
			);
		}

		const subtotalCents = Number(cart.subtotal);
		const discount = this.calcDiscount(subtotalCents, coupon);

		return {
			code: coupon.code,
			type: coupon.type,
			discount: Price.toOutput(String(discount)),
		};
	}

	async clearCart(userId: string) {
		const cart = await this.getOrCreate(userId);
		await cartRepository.clearItems(cart.id);
		await cartRepository.updateTotals(cart.id, {
			subtotal: '0',
			shippingCost: '0',
			taxAmount: '0',
			total: '0',
			couponId: null,
		});
	}

	// ── Private ───────────────────────────────────────────────

	/**
	 * Retorna o estoque disponível para um produto/SKU.
	 * Lança BadRequestError se o produto/SKU não for encontrado.
	 */
	private async getAvailableStock(
		productId: string,
		skuId?: string | null,
	): Promise<number> {
		if (skuId) {
			const sku = await cartRepository.findSkuById(skuId);
			if (!sku) {
				throw new BadRequestError('SKU não encontrado.');
			}
			if (sku.stock <= 0) {
				throw new BadRequestError('Produto esgotado.');
			}
			return sku.stock;
		}

		// Produto simples
		const product = await cartRepository.findProductById(productId);
		if (!product) {
			throw new BadRequestError('Produto não encontrado.');
		}
		if (product.hasVariations) {
			throw new BadRequestError(
				'Este produto requer a seleção de um SKU (variação).',
			);
		}
		if ((product.stock ?? 0) <= 0) {
			throw new BadRequestError('Produto esgotado.');
		}
		return product.stock ?? 0;
	}

	/**
	 * Resolve o preço para snapshot do carrinho.
	 * NUNCA retorna "0" silenciosamente — lança erro se não encontrar.
	 */
	private async resolvePriceSnapshot(
		productId: string,
		skuId?: string | null,
	): Promise<string> {
		if (skuId) {
			const sku = await cartRepository.findSkuById(skuId);
			if (!sku) {
				throw new BadRequestError('SKU não encontrado.');
			}
			return String(sku.price);
		}

		const product = await cartRepository.findProductById(productId);
		if (!product || product.price == null) {
			throw new BadRequestError('Produto não encontrado ou sem preço.');
		}
		return String(product.price);
	}

	/**
	 * Recarrega o carrinho, recalcula totais e serializa.
	 */
	private async refreshAndSerialize(userId: string, cartId: string) {
		const updated = await this.getOrCreate(userId);
		const totals = this.calculateTotals(updated);
		await cartRepository.updateTotals(cartId, totals);

		const final = await this.getOrCreate(userId);
		return this.serializeCart(final);
	}

	private calculateTotals(cart: LoadedCart) {
		const subtotalCents = cart.items.reduce(
			(acc, item) => acc + Number(item.priceSnapshot) * item.quantity,
			0,
		);

		const shippingCents = subtotalCents === 0 ? 0 : 800;

		const discountCents = cart.coupon
			? this.calcDiscount(subtotalCents, cart.coupon)
			: 0;

		const totalCents = Math.max(
			0,
			subtotalCents + shippingCents - discountCents,
		);

		return {
			subtotal: String(subtotalCents),
			shippingCost: String(shippingCents),
			taxAmount: '0',
			total: String(totalCents),
		};
	}

	private calcDiscount(
		subtotalCents: number,
		coupon: { type: string; value: number },
	): number {
		if (coupon.type === 'free_shipping') {
			return 800;
		}
		if (coupon.type === 'percentage') {
			return Math.round(subtotalCents * (coupon.value / 100));
		}
		if (coupon.type === 'fixed') {
			return Math.min(subtotalCents, coupon.value);
		}
		return 0;
	}

	private serializeCart(cart: LoadedCart) {
		return {
			id: cart.id,
			coupon: cart.coupon
				? { code: cart.coupon.code, type: cart.coupon.type }
				: null,
			items: cart.items.map((item) => {
				const optionLabels: Record<string, string> = {};
				if (item.sku && 'optionMappings' in item.sku) {
					for (const mapping of (item.sku as any).optionMappings) {
						optionLabels[mapping.variationOption.variationType.name] =
							mapping.variationOption.value;
					}
				}

				return {
					id: item.id,
					productId: item.productId,
					skuId: item.skuId,
					quantity: item.quantity,
					price: Price.toOutput(item.priceSnapshot),
					subtotal: Price.toOutput(
						String(Number(item.priceSnapshot) * item.quantity),
					),
					product: item.product
						? {
							name: item.product.name,
							slug: item.product.slug,
							imageUrl:
								item.product.images?.[0]?.url ?? null,
						}
						: null,
					sku: item.sku
						? {
							skuCode: item.sku.skuCode,
							optionLabels,
						}
						: null,
				};
			}),
			totals: {
				subtotal: Price.toOutput(cart.subtotal),
				shipping: Price.toOutput(cart.shippingCost),
				tax: Price.toOutput(cart.taxAmount),
				total: Price.toOutput(cart.total),
				itemCount: cart.items.reduce((acc, i) => acc + i.quantity, 0),
			},
			updatedAt: cart.updatedAt,
		};
	}
}
