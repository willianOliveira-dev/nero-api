/**
 * orders.schema.ts
 * ─────────────────────────────────────────────────────────────
 * Pedidos e itens do pedido.
 *
 * Fluxo de status:
 *   pending → paid → processing → shipped → delivered
 *                 ↘ cancelled (qualquer etapa antes de shipped)
 *
 * shippingAddress (JSONB): snapshot imutável do endereço
 *   no momento do pedido. Mesmo que o usuário edite/delete
 *   o endereço depois, o histórico do pedido fica intacto.
 *
 * productSnapshot em order_items: snapshot de {name, imageUrl,
 *   attributes} — garante que o histórico de pedidos seja
 *   imutável mesmo que o produto seja editado/arquivado.
 *
 * stripePaymentIntentId: usado para reconciliar o webhook
 *   payment_intent.succeeded com o pedido correto.
 * ─────────────────────────────────────────────────────────────
 */

import {
    index,
    integer,
    jsonb,
    numeric,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { user } from './auth.schema';
import { coupons } from './coupons.schema';
import { paymentMethods } from './payment-methods.schema';
import { productVariants } from './product-variants.schema';
import { products } from './products.schema';
import { userAddresses } from './user-addresses.schema';

// ── Enums ─────────────────────────────────────────────────────
export const orderStatusEnum = pgEnum('order_status_enum', [
    'pending',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
]);

// ── Tipos para JSONB ──────────────────────────────────────────
export type ShippingAddressSnapshot = {
    recipientName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    complement?: string;
};

export type ProductSnapshot = {
    name: string;
    imageUrl: string;
    attributes: Record<string, string>;
};

// ── orders ────────────────────────────────────────────────────
export const orders = pgTable(
    'orders',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => uuidv7()),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'restrict' }),
        status: orderStatusEnum('status').notNull().default('pending'),

        // ── Valores financeiros
        subtotalAmount: numeric('subtotal_amount', {
            precision: 10,
            scale: 2,
        }).notNull(),
        shippingAmount: numeric('shipping_amount', { precision: 10, scale: 2 })
            .notNull()
            .default('0'),
        taxAmount: numeric('tax_amount', { precision: 10, scale: 2 })
            .notNull()
            .default('0'),
        discountAmount: numeric('discount_amount', { precision: 10, scale: 2 })
            .notNull()
            .default('0'),
        /** subtotal + shipping + tax - discount */
        totalAmount: numeric('total_amount', {
            precision: 10,
            scale: 2,
        }).notNull(),

        // ── Referências
        couponId: text('coupon_id').references(() => coupons.id, {
            onDelete: 'set null',
        }),
        shippingAddressId: text('shipping_address_id').references(
            () => userAddresses.id,
            {
                onDelete: 'set null',
            },
        ),
        /** Snapshot imutável — mantém histórico mesmo se endereço for deletado */
        shippingAddress: jsonb('shipping_address')
            .$type<ShippingAddressSnapshot>()
            .notNull(),
        paymentMethodId: text('payment_method_id').references(
            () => paymentMethods.id,
            {
                onDelete: 'set null',
            },
        ),

        // ── Stripe
        /** ID do PaymentIntent — usado para reconciliar webhook */
        stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
        stripeChargeId: text('stripe_charge_id'),

        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (t) => [
        index('idx_orders_user_id').on(t.userId),
        index('idx_orders_status').on(t.status),
        index('idx_orders_user_status').on(t.userId, t.status),
        uniqueIndex('idx_orders_stripe_pi').on(t.stripePaymentIntentId),
    ],
);

// ── order_items ───────────────────────────────────────────────
export const orderItems = pgTable(
    'order_items',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => uuidv7()),
        orderId: text('order_id')
            .notNull()
            .references(() => orders.id, { onDelete: 'cascade' }),
        productId: text('product_id').references(() => products.id, {
            onDelete: 'set null',
        }),
        variantId: text('variant_id').references(() => productVariants.id, {
            onDelete: 'set null',
        }),
        quantity: integer('quantity').notNull(),
        unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
        /** Snapshot de name, imageUrl e atributos — imutável */
        productSnapshot: jsonb('product_snapshot')
            .$type<ProductSnapshot>()
            .notNull(),
    },
    (t) => [index('idx_order_items_order_id').on(t.orderId)],
);

// ── Types ─────────────────────────────────────────────────────
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
