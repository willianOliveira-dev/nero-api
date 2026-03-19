import { stripe } from '@/lib/stripe';
import { env } from '@/config/env';
import { db } from '@/lib/db/connection';
import {
    userProfiles,
    userAddresses,
    orders,
    orderItems,
    coupons,
    cartItems,
    carts,
    paymentMethods,
    type ShippingAddressSnapshot,
    type ProductSnapshot,
} from '@/lib/db/schemas/index.schema';
import { eq, and } from 'drizzle-orm';
import { BadRequestError, NotFoundError } from '@/shared/errors/app.error';
import { PaymentsRepository } from '../repositories/payments.repository';
import { OrdersRepository } from '../../orders/repositories/orders.repository';
import { CartRepository } from '../../cart/repositories/cart.repository';
import type { CreatePaymentIntentBody } from '../validations/payments.validation';
import type Stripe from 'stripe';

const paymentsRepository = new PaymentsRepository();
const ordersRepository = new OrdersRepository();
const cartRepository = new CartRepository();

export class PaymentsService {
    // ── SetupIntent (save card) ─────────────────────────────────

    async createSetupIntent(userId: string, email: string) {
        const customerId = await this.getOrCreateStripeCustomer(userId, email);

        const ephemeralKey = await stripe.ephemeralKeys.create(
            { customer: customerId },
            { apiVersion: '2026-02-25.clover' },
        );

        const setupIntent = await stripe.setupIntents.create({
            customer: customerId,
            payment_method_types: ['card'],
            metadata: { userId },
        });

        // Create a pending record so we can track it
        await paymentsRepository.create({
            userId,
            stripePaymentMethodId: `pending_${setupIntent.id}`,
            stripeSetupIntentId: setupIntent.id,
            setupIntentStatus: 'pending',
            type: 'card',
            brand: 'other',
            last4: '0000',
            expMonth: 0,
            expYear: 0,
        });

        return {
            clientSecret: setupIntent.client_secret!,
            customerId,
            ephemeralKey: ephemeralKey.secret!,
        };
    }

    // ── Payment Methods CRUD ────────────────────────────────────

    async listPaymentMethods(userId: string) {
        const methods = await paymentsRepository.findByUserId(userId);
        return methods
            .filter((m) => m.setupIntentStatus === 'succeeded')
            .map(serializePaymentMethod);
    }

    async setDefaultPaymentMethod(userId: string, id: string) {
        const method = await paymentsRepository.findById(id);
        if (!method || method.userId !== userId) {
            throw new NotFoundError('Método de pagamento');
        }
        const updated = await paymentsRepository.setDefault(userId, id);
        return serializePaymentMethod(updated!);
    }

    async deletePaymentMethod(userId: string, id: string) {
        const method = await paymentsRepository.findById(id);
        if (!method || method.userId !== userId) {
            throw new NotFoundError('Método de pagamento');
        }

        // Detach from Stripe
        try {
            await stripe.paymentMethods.detach(method.stripePaymentMethodId);
        } catch {
            // If it fails on Stripe side, still remove from DB
        }

        await paymentsRepository.delete(id, userId);
        return { deleted: true };
    }

    // ── PaymentIntent (charge) ──────────────────────────────────

    async createPaymentIntent(userId: string, body: CreatePaymentIntentBody) {
        // 1. Validate payment method belongs to user
        const paymentMethod = await paymentsRepository.findById(
            body.paymentMethodId,
        );
        if (!paymentMethod || paymentMethod.userId !== userId) {
            throw new NotFoundError('Método de pagamento');
        }
        if (paymentMethod.setupIntentStatus !== 'succeeded') {
            throw new BadRequestError(
                'Método de pagamento ainda não confirmado.',
            );
        }

        // 2. Validate shipping address belongs to user
        const address = await db.query.userAddresses.findFirst({
            where: and(
                eq(userAddresses.id, body.shippingAddressId),
                eq(userAddresses.userId, userId),
            ),
        });
        if (!address) {
            throw new NotFoundError('Endereço de envio');
        }

        // 3. Load cart using existing CartRepository
        const cart = await cartRepository.findOrCreateByUserId(userId);
        if (!cart || cart.items.length === 0) {
            throw new BadRequestError('Carrinho vazio.');
        }

        // 4. Calculate totals server-side from cart items
        let subtotalCents = 0;
        const orderItemsData: {
            productId: string;
            skuId: string | null;
            quantity: number;
            unitPrice: string;
            productSnapshot: ProductSnapshot;
        }[] = [];

        for (const item of cart.items) {
            const product = item.product;
            if (!product) continue;

            const unitPrice = Number(item.priceSnapshot);
            const itemTotal = unitPrice * item.quantity;
            subtotalCents += itemTotal;

            const imageUrl =
                'images' in product && Array.isArray(product.images)
                    ? (product.images[0]?.url ?? product.thumbnailUrl ?? '')
                    : (product.thumbnailUrl ?? '');

            const optionLabels: Record<string, string> = {};
            if (item.sku && 'optionMappings' in item.sku) {
                for (const mapping of (item.sku as { optionMappings: { variationOption: { variationType: { name: string }; value: string } }[] }).optionMappings) {
                    const vtName = mapping.variationOption?.variationType?.name ?? '';
                    const optName = mapping.variationOption?.value ?? '';
                    if (vtName) optionLabels[vtName] = optName;
                }
            }

            orderItemsData.push({
                productId: product.id,
                skuId: item.skuId,
                quantity: item.quantity,
                unitPrice: String(unitPrice),
                productSnapshot: {
                    name: product.name,
                    imageUrl,
                    optionLabels,
                },
            });
        }

        // 5. Apply coupon discount
        let discountCents = 0;
        let couponId: string | null = null;

        if (cart.coupon) {
            couponId = cart.coupon.id;
            if (cart.coupon.type === 'percentage') {
                discountCents = Math.round(
                    subtotalCents * (Number(cart.coupon.value) / 100),
                );
            } else if (cart.coupon.type === 'fixed') {
                discountCents = Math.min(
                    subtotalCents,
                    Number(cart.coupon.value),
                );
            } else if (cart.coupon.type === 'free_shipping') {
                discountCents = 800; // assuming fixed 8.00 shipping
            }
        }

        // Override with couponCode from body if provided and no cart coupon
        if (body.couponCode && !cart.coupon) {
            const coupon = await db.query.coupons.findFirst({
                where: eq(coupons.code, body.couponCode),
            });
            if (coupon && coupon.isActive) {
                couponId = coupon.id;
                if (coupon.type === 'percentage') {
                    discountCents = Math.round(
                        subtotalCents * (Number(coupon.value) / 100),
                    );
                } else if (coupon.type === 'fixed') {
                    discountCents = Math.min(
                        subtotalCents,
                        Number(coupon.value),
                    );
                }
            }
        }

        const shippingCents = subtotalCents > 0 ? 800 : 0;
        const totalCents = Math.max(
            subtotalCents + shippingCents - discountCents,
            50,
        ); // Stripe minimum is 50 cents

        // 6. Get Stripe customer
        const customerId = await this.getOrCreateStripeCustomer(userId, '');

        // 7. Create pending order in DB
        const shippingSnapshot: ShippingAddressSnapshot = {
            recipientName: address.recipientName,
            street: address.street,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            country: address.country,
            complement: address.complement ?? undefined,
        };

        const [order] = await db
            .insert(orders)
            .values({
                userId,
                status: 'pending',
                subtotalAmount: String(subtotalCents),
                shippingAmount: String(shippingCents),
                discountAmount: String(discountCents),
                totalAmount: String(totalCents),
                couponId,
                shippingAddressId: body.shippingAddressId,
                shippingAddress: shippingSnapshot,
                paymentMethodId: paymentMethod.id,
            })
            .returning();

        // Insert order items
        if (orderItemsData.length > 0) {
            await db.insert(orderItems).values(
                orderItemsData.map((item) => ({
                    orderId: order.id,
                    ...item,
                })),
            );
        }

        // 8. Create PaymentIntent on Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalCents,
            currency: env.STRIPE_CURRENCY,
            customer: customerId,
            payment_method: paymentMethod.stripePaymentMethodId,
            metadata: {
                orderId: order.id,
                userId,
            },
        });

        // Save Stripe PI ID on order
        await db
            .update(orders)
            .set({
                stripePaymentIntentId: paymentIntent.id,
                updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id));

        return {
            clientSecret: paymentIntent.client_secret!,
            amount: totalCents,
            orderId: order.id,
        };
    }

    // ── Webhook handlers ────────────────────────────────────────

    async handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
        // Idempotency: check if already processed
        const existing = await paymentsRepository.findByStripeSetupIntentId(
            setupIntent.id,
        );
        if (existing && existing.setupIntentStatus === 'succeeded') {
            return; // Already processed
        }

        const pmId =
            typeof setupIntent.payment_method === 'string'
                ? setupIntent.payment_method
                : setupIntent.payment_method?.id;

        if (!pmId) return;

        // Retrieve full payment method from Stripe
        const pm = await stripe.paymentMethods.retrieve(pmId);
        const card = pm.card;
        if (!card) return;

        const userId = setupIntent.metadata?.userId;
        if (!userId) return;

        const brand = mapCardBrand(card.brand ?? 'unknown');

        if (existing) {
            // Update the pending record
            await db
                .update(paymentMethods)
                .set({
                    stripePaymentMethodId: pmId,
                    setupIntentStatus: 'succeeded',
                    brand,
                    last4: card.last4 ?? '0000',
                    expMonth: card.exp_month,
                    expYear: card.exp_year,
                    fingerprint: card.fingerprint ?? null,
                    updatedAt: new Date(),
                })
                .where(
                    eq(paymentMethods.stripeSetupIntentId, setupIntent.id),
                );
        } else {
            await paymentsRepository.create({
                userId,
                stripePaymentMethodId: pmId,
                stripeSetupIntentId: setupIntent.id,
                setupIntentStatus: 'succeeded',
                type: 'card',
                brand,
                last4: card.last4 ?? '0000',
                expMonth: card.exp_month,
                expYear: card.exp_year,
                fingerprint: card.fingerprint ?? null,
            });
        }

        // If it's the first card, set as default
        const allMethods = await paymentsRepository.findByUserId(userId);
        const succeededMethods = allMethods.filter(
            (m) => m.setupIntentStatus === 'succeeded',
        );
        if (succeededMethods.length === 1) {
            await paymentsRepository.setDefault(
                userId,
                succeededMethods[0].id,
            );
        }
    }

    async handleSetupIntentCancelled(setupIntent: Stripe.SetupIntent) {
        await paymentsRepository.updateSetupIntentStatus(
            setupIntent.id,
            'cancelled',
        );
    }

    async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
        const orderId = paymentIntent.metadata?.orderId;
        if (!orderId) return;

        const order = await ordersRepository.findById(orderId);
        if (!order) return;
        if (order.status !== 'pending') return; // Idempotency

        // Use raw DB update instead of ordersRepository.updateStatus
        // because the repo's type expects admin-level statuses only
        await db
            .update(orders)
            .set({ status: 'paid', updatedAt: new Date() })
            .where(eq(orders.id, orderId));

        // Save charge ID if available
        const chargeId =
            typeof paymentIntent.latest_charge === 'string'
                ? paymentIntent.latest_charge
                : paymentIntent.latest_charge?.id;

        if (chargeId) {
            await db
                .update(orders)
                .set({ stripeChargeId: chargeId, updatedAt: new Date() })
                .where(eq(orders.id, orderId));
        }

        // Clear cart after successful payment
        const userId = paymentIntent.metadata?.userId;
        if (userId) {
            const userCart = await db.query.carts.findFirst({
                where: eq(carts.userId, userId),
            });
            if (userCart) {
                await db
                    .delete(cartItems)
                    .where(eq(cartItems.cartId, userCart.id));
            }
        }
    }

    async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
        const orderId = paymentIntent.metadata?.orderId;
        if (!orderId) return;

        await db
            .update(orders)
            .set({ status: 'cancelled', updatedAt: new Date() })
            .where(eq(orders.id, orderId));
    }

    async handleChargeRefunded(charge: Stripe.Charge) {
        const piId =
            typeof charge.payment_intent === 'string'
                ? charge.payment_intent
                : charge.payment_intent?.id;

        if (!piId) return;

        const order = await db.query.orders.findFirst({
            where: eq(orders.stripePaymentIntentId, piId),
        });

        if (!order) return;

        await db
            .update(orders)
            .set({ status: 'cancelled', updatedAt: new Date() })
            .where(eq(orders.id, order.id));
    }

    // ── Private ─────────────────────────────────────────────────

    private async getOrCreateStripeCustomer(
        userId: string,
        email: string,
    ): Promise<string> {
        const profile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, userId),
        });

        if (profile?.stripeCustomerId) {
            return profile.stripeCustomerId;
        }

        const customer = await stripe.customers.create({
            email: email || undefined,
            metadata: { userId },
        });

        if (profile) {
            await db
                .update(userProfiles)
                .set({
                    stripeCustomerId: customer.id,
                    updatedAt: new Date(),
                })
                .where(eq(userProfiles.id, profile.id));
        }

        return customer.id;
    }
}

// ── Helpers ─────────────────────────────────────────────────────

type CardBrand =
    | 'visa'
    | 'mastercard'
    | 'amex'
    | 'discover'
    | 'elo'
    | 'hipercard'
    | 'other';

function mapCardBrand(stripeBrand: string): CardBrand {
    const map: Record<string, CardBrand> = {
        visa: 'visa',
        mastercard: 'mastercard',
        amex: 'amex',
        discover: 'discover',
        elo: 'elo',
        hipercard: 'hipercard',
    };
    return map[stripeBrand.toLowerCase()] ?? 'other';
}

type LoadedPaymentMethod = NonNullable<
    Awaited<ReturnType<PaymentsRepository['findById']>>
>;

function serializePaymentMethod(pm: LoadedPaymentMethod) {
    return {
        id: pm.id,
        type: pm.type,
        brand: pm.brand,
        last4: pm.last4,
        expMonth: pm.expMonth,
        expYear: pm.expYear,
        cardholderName: pm.cardholderName,
        isDefault: pm.isDefault,
        createdAt: pm.createdAt,
    };
}
