/**
 * coupons.schema.ts
 * ─────────────────────────────────────────────────────────────
 * Cupons de desconto aplicados no carrinho ou checkout.
 *
 * Tipos:
 *   percentage   → valor = 20 significa 20% de desconto
 *   fixed        → valor = 20 significa $20,00 de desconto
 *   free_shipping → ignora o campo value, zera o frete
 *
 * usedCount: incrementado atomicamente no momento da criação
 *   do pedido (dentro de transaction com SELECT FOR UPDATE).
 * ─────────────────────────────────────────────────────────────
 */

import {
  pgTable,
  uuid,
  varchar,
  numeric,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";

// ── Enum ──────────────────────────────────────────────────────
export const couponTypeEnum = pgEnum("coupon_type_enum", [
  "percentage",
  "fixed",
  "free_shipping",
]);

// ── Table ─────────────────────────────────────────────────────
export const coupons = pgTable(
  "coupons",
  {
    id:            uuid("id").primaryKey().defaultRandom(),
    /** Código digitado pelo usuário — ex: NERO20 */
    code:          varchar("code", { length: 50 }).notNull().unique(),
    type:          couponTypeEnum("type").notNull(),
    /** % ou valor fixo. Ignorado quando type = free_shipping */
    value:         numeric("value", { precision: 10, scale: 2 }).notNull(),
    /** Pedido mínimo para aplicar o cupom */
    minOrderValue: numeric("min_order_value", { precision: 10, scale: 2 }),
    /** null = uso ilimitado */
    maxUses:       integer("max_uses"),
    usedCount:     integer("used_count").notNull().default(0),
    expiresAt:     timestamp("expires_at"),
    isActive:      boolean("is_active").notNull().default(true),
  },
  (t) => [
    uniqueIndex("idx_coupons_code").on(t.code),
  ]
);

// ── Types ─────────────────────────────────────────────────────
export type Coupon    = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
