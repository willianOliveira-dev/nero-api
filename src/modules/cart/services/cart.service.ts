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
     * Lança erro interno se o banco falhar no insert (não deve acontecer).
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

        const existing = await cartRepository.findItemByProduct(
            cart.id,
            input.productId,
            input.variantId,
        );

        if (existing) {
            await cartRepository.updateItemQuantity(
                existing.id,
                existing.quantity + input.quantity,
            );
        } else {
            const priceSnapshot = this.resolvePriceSnapshot(
                cart,
                input.productId,
                input.variantId,
            );
            await cartRepository.addItem({
                cartId: cart.id,
                productId: input.productId,
                variantId: input.variantId,
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
            const min = Price.format(
                String(Number(coupon.minOrderValue) * 100),
            );
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

    /**
     * Recarrega o carrinho, recalcula totais e serializa.
     * Padrão usado após qualquer mutação para retornar estado atualizado.
     */
    private async refreshAndSerialize(userId: string, cartId: string) {
        const updated = await this.getOrCreate(userId);
        const totals = this.calculateTotals(updated);
        await cartRepository.updateTotals(cartId, totals);

        const final = await this.getOrCreate(userId);
        return this.serializeCart(final);
    }

    private resolvePriceSnapshot(
        cart: LoadedCart,
        productId: string,
        variantId?: string | null,
    ): string {
        const existingItem = cart.items.find((i) => i.productId === productId);

        if (existingItem) {
            if (variantId && existingItem.variant?.price) {
                return existingItem.variant.price;
            }
            if (existingItem.product?.basePrice) {
                return existingItem.product.basePrice;
            }
        }

        return '0';
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
        coupon: { type: string; value: string },
    ): number {
        if (coupon.type === 'free_shipping') {
            return 800;
        }
        if (coupon.type === 'percentage') {
            return Math.round(subtotalCents * (Number(coupon.value) / 100));
        }
        if (coupon.type === 'fixed') {
            return Math.min(subtotalCents, Number(coupon.value) * 100);
        }
        return 0;
    }

    private serializeCart(cart: LoadedCart) {
        return {
            id: cart.id,
            coupon: cart.coupon
                ? { code: cart.coupon.code, type: cart.coupon.type }
                : null,
            items: cart.items.map((item) => ({
                id: item.id,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                price: Price.toOutput(item.priceSnapshot),
                subtotal: Price.toOutput(
                    String(Number(item.priceSnapshot) * item.quantity),
                ),
                product: item.product
                    ? {
                          name: item.product.name,
                          slug: item.product.slug,
                          imageUrl: item.product.images?.[0]?.url ?? null,
                      }
                    : null,
                variant: item.variant
                    ? {
                          sku: item.variant.sku,
                          attributes: item.variant.attributes,
                      }
                    : null,
            })),
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
