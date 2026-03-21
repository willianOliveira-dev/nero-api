import {
    boolean,
    index,
    pgEnum,
    pgTable,
    smallint,
    text,
    timestamp,
    varchar,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { user } from './auth.schema';

export const paymentMethodTypeEnum = pgEnum('payment_method_type_enum', [
    'card',
]);

export const cardBrandEnum = pgEnum('card_brand_enum', [
    'visa',
    'mastercard',
    'amex',
    'discover',
    'elo',
    'hipercard',
    'other',
]);

export const setupIntentStatusEnum = pgEnum('setup_intent_status_enum', [
    'pending',
    'succeeded',
    'cancelled',
]);

export const paymentMethods = pgTable(
    'payment_methods',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => uuidv7()),

        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),

        // Stripe IDs 
        stripePaymentMethodId: text('stripe_payment_method_id')
            .notNull()
            .unique(),
        /** ID do SetupIntent que originou este método */
        stripeSetupIntentId: text('stripe_setup_intent_id')
            .notNull()
            .unique(),
        /** Status do SetupIntent — atualizado via webhook */
        setupIntentStatus: setupIntentStatusEnum('setup_intent_status')
            .notNull()
            .default('pending'),
        // Metadados do cartão
        type: paymentMethodTypeEnum('type').notNull().default('card'),
        brand: cardBrandEnum('brand').notNull(),
        /** Últimos 4 dígitos exibidos como **** 4187 */
        last4: varchar('last4', { length: 4 }).notNull(),
        expMonth: smallint('exp_month').notNull(),
        expYear: smallint('exp_year').notNull(),
        /** Nome do titular impresso no cartão */
        cardholderName: text('cardholder_name'),
        /** Fingerprint do Stripe — detecta cartão duplicado */
        fingerprint: text('fingerprint').unique(),
        isDefault: boolean('is_default').notNull().default(false),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (t) => [
        index('idx_payment_methods_user_id').on(t.userId),
        index('idx_payment_methods_fingerprint').on(t.fingerprint),
    ],
);

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;