/**
 * payment-methods.schema.ts
 * ─────────────────────────────────────────────────────────────
 * Métodos de pagamento salvos via Stripe.
 * ⚠ NUNCA armazenar número de cartão, CVV ou dados sensíveis.
 * Apenas metadados retornados pelo Stripe após o SetupIntent.
 *
 * Fluxo de cadastro:
 *  1. POST /v1/me/payment-methods/setup-intent
 *     → cria SetupIntent no Stripe, retorna clientSecret
 *  2. SDK Stripe (mobile) coleta e confirma o cartão
 *  3. Stripe chama webhook → backend salva paymentMethodId
 * ─────────────────────────────────────────────────────────────
 */

import {
  pgTable,
  uuid,
  text,
  varchar,
  smallint,
  boolean,
  timestamp,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { user } from "./auth.schema";

// ── Enums ─────────────────────────────────────────────────────
export const paymentMethodTypeEnum = pgEnum("payment_method_type_enum", [
  "card",
  "paypal",
  "pix",
]);

export const cardBrandEnum = pgEnum("card_brand_enum", [
  "visa",
  "mastercard",
  "amex",
  "discover",
  "elo",
  "hipercard",
  "other",
]);

// ── Table ─────────────────────────────────────────────────────
export const paymentMethods = pgTable(
  "payment_methods",
  {
    id:                    uuid("id").primaryKey().defaultRandom(),
    userId:                text("user_id")
                             .notNull()
                             .references(() => user.id, { onDelete: "cascade" }),
    stripePaymentMethodId: text("stripe_payment_method_id").notNull().unique(),
    type:                  paymentMethodTypeEnum("type").notNull(),
    brand:                 cardBrandEnum("brand"),
    /** Últimos 4 dígitos exibidos como **** 4187 */
    last4:                 varchar("last4", { length: 4 }),
    expMonth:              smallint("exp_month"),
    expYear:               smallint("exp_year"),
    /** PayPal ou outros provedores: e-mail vinculado */
    providerEmail:         text("provider_email"),
    isDefault:             boolean("is_default").notNull().default(false),
    createdAt:             timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_payment_methods_user_id").on(t.userId),
  ]
);

// ── Types ─────────────────────────────────────────────────────
export type PaymentMethod    = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;
