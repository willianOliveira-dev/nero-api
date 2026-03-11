/**
 * carts.schema.ts
 * ─────────────────────────────────────────────────────────────
 * Carrinho de compras.
 * 1 carrinho ativo por usuário (UNIQUE em userId).
 *
 * Os totais (subtotal, shippingCost, taxAmount, total)
 * são recalculados pelo Service a cada modificação do carrinho
 * e persistidos para evitar recálculo a cada GET.
 *
 * priceSnapshot em cart_items: preço no momento da adição.
 *   Isso protege o usuário se o preço mudar enquanto o produto
 *   está no carrinho. O checkout usa o preço do carrinho.
 * ─────────────────────────────────────────────────────────────
 */

import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  timestamp,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql }             from "drizzle-orm";
import { user }            from "./auth.schema";
import { coupons }         from "./coupons.schema";
import { products }        from "./products.schema";
import { productVariants } from "./product-variants.schema";

// ── carts ─────────────────────────────────────────────────────
export const carts = pgTable(
  "carts",
  {
    id:           uuid("id").primaryKey().defaultRandom(),
    userId:       text("user_id")
                    .notNull()
                    .unique()
                    .references(() => user.id, { onDelete: "cascade" }),
    couponId:     uuid("coupon_id")
                    .references(() => coupons.id, { onDelete: "set null" }),
    subtotal:     numeric("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
    shippingCost: numeric("shipping_cost", { precision: 10, scale: 2 }).notNull().default("8.00"),
    taxAmount:    numeric("tax_amount", { precision: 10, scale: 2 }).notNull().default("0"),
    /** subtotal + shippingCost + taxAmount - desconto do cupom */
    total:        numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
    updatedAt:    timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("idx_carts_user_id").on(t.userId),
  ]
);

// ── cart_items ────────────────────────────────────────────────
export const cartItems = pgTable(
  "cart_items",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    cartId:         uuid("cart_id")
                      .notNull()
                      .references(() => carts.id, { onDelete: "cascade" }),
    productId:      uuid("product_id")
                      .notNull()
                      .references(() => products.id, { onDelete: "cascade" }),
    /** null = produto sem variante (sem seleção de tamanho/cor) */
    variantId:      uuid("variant_id")
                      .references(() => productVariants.id, { onDelete: "set null" }),
    quantity:       integer("quantity").notNull().default(1),
    /** Preço no momento da adição — imutável no item */
    priceSnapshot:  numeric("price_snapshot", { precision: 10, scale: 2 }).notNull(),
  },
  (t) => [
    index("idx_cart_items_cart_id").on(t.cartId),
    check("chk_cart_item_quantity", sql`${t.quantity} > 0`),
  ]
);

// ── Types ─────────────────────────────────────────────────────
export type Cart        = typeof carts.$inferSelect;
export type NewCart     = typeof carts.$inferInsert;
export type CartItem    = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;
