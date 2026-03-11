/**
 * index.ts
 * ─────────────────────────────────────────────────────────────
 * Re-exporta todos os schemas e relations.
 * Use este arquivo como ponto de entrada no drizzle.config.ts.
 *
 * Exemplo de drizzle.config.ts:
 *
 *   import { defineConfig } from "drizzle-kit";
 *
 *   export default defineConfig({
 *     schema:    "./src/db/index.ts",
 *     out:       "./src/db/migrations",
 *     dialect:   "postgresql",
 *     dbCredentials: {
 *       url: process.env.DATABASE_URL!,
 *     },
 *   });
 * ─────────────────────────────────────────────────────────────
 */

// ── Relations (Relational Query API) ─────────────────────────
export * from '../relations';
export * from './attribute-types.schema';
// ── Better Auth (nativo) ──────────────────────────────────────
export * from './auth.schema';
// ── Carrinho ──────────────────────────────────────────────────
export * from './carts.schema';

// ── Catálogo ──────────────────────────────────────────────────
export * from './categories.schema';
// ── Promoções ─────────────────────────────────────────────────
export * from './coupons.schema';
// ── Home ──────────────────────────────────────────────────────
export * from './home-sections.schema';
// ── Pedidos ───────────────────────────────────────────────────
export * from './orders.schema';
export * from './payment-methods.schema';
export * from './product-images.schema';
export * from './product-reviews.schema';
export * from './product-variants.schema';
export * from './products.schema';
export * from './user-addresses.schema';
// ── Usuário ───────────────────────────────────────────────────
export * from './user-profiles.schema';
// ── Wishlist ──────────────────────────────────────────────────
export * from './wishlists.schema';
