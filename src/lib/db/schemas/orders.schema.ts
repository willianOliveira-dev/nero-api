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
import { productSkus } from './product-skus.schema';
import { products } from './products.schema';
import { userAddresses } from './user-addresses.schema';

export const orderStatusEnum = pgEnum('order_status_enum', [
	'pending',
	'paid',
	'processing',
	'shipped',
	'delivered',
	'cancelled',
]);

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
	optionLabels: Record<string, string>;
};

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
		totalAmount: numeric('total_amount', {
			precision: 10,
			scale: 2,
		}).notNull(),

		couponId: text('coupon_id').references(() => coupons.id, {
			onDelete: 'set null',
		}),
		shippingAddressId: text('shipping_address_id').references(
			() => userAddresses.id,
			{
				onDelete: 'set null',
			},
		),
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
		/** null = produto simples */
		skuId: text('sku_id').references(() => productSkus.id, {
			onDelete: 'set null',
		}),
		quantity: integer('quantity').notNull(),
		unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
		/** Snapshot de name, imageUrl e optionLabels — imutável */
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
