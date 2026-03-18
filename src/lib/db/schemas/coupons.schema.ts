import {
    boolean,
    integer,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';


export const couponTypeEnum = pgEnum('coupon_type_enum', [
    'percentage',
    'fixed',
    'free_shipping',
]);

export const coupons = pgTable(
    'coupons',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => uuidv7()),
        /** Código digitado pelo usuário — ex: NERO20 */
        code: varchar('code', { length: 50 }).notNull().unique(),
        type: couponTypeEnum('type').notNull(),
        /** % ou valor fixo em centavos. Ignorado quando type = free_shipping */
        value: integer('value').notNull(),
        /** Pedido mínimo em centavos para aplicar o cupom */
        minOrderValue: integer('min_order_value'),
        /** null = uso ilimitado */
        maxUses: integer('max_uses'),
        usedCount: integer('used_count').notNull().default(0),
        expiresAt: timestamp('expires_at'),
        isActive: boolean('is_active').notNull().default(true),
    },
    (t) => [uniqueIndex('idx_coupons_code').on(t.code)],
);

// ── Types ─────────────────────────────────────────────────────
export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
