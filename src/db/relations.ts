/**
 * relations.ts
 * ─────────────────────────────────────────────────────────────
 * Define todas as relações do Drizzle ORM para uso com
 * db.query (Relational Query API).
 *
 * Cobertura completa:
 *   Better Auth   → user : session, account
 *   Usuário       → userProfiles, userAddresses, paymentMethods
 *   Catálogo      → categories, products, productVariants, productImages
 *   Wishlist      → wishlists, wishlistItems
 *   Carrinho      → carts, cartItems
 *   Pedidos       → orders, orderItems
 *   Reviews       → productReviews
 *   Home          → homeSections
 * ─────────────────────────────────────────────────────────────
 */

import { relations } from 'drizzle-orm';

import { account, session, user } from './schemas/auth.schema';
import { cartItems, carts } from './schemas/carts.schema';
import { categories } from './schemas/categories.schema';
import { coupons } from './schemas/coupons.schema';
import { orderItems, orders } from './schemas/orders.schema';
import { paymentMethods } from './schemas/payment-methods.schema';
import { productImages } from './schemas/product-images.schema';
import { productReviews } from './schemas/product-reviews.schema';
import { productVariants } from './schemas/product-variants.schema';
import { products } from './schemas/products.schema';
import { userAddresses } from './schemas/user-addresses.schema';
import { userProfiles } from './schemas/user-profiles.schema';
import { wishlistItems, wishlists } from './schemas/wishlists.schema';

// ════════════════════════════════════════════════════════════
//  BETTER AUTH — user
// ════════════════════════════════════════════════════════════
export const userRelations = relations(user, ({ one, many }) => ({
    // Better Auth nativo
    sessions: many(session),
    accounts: many(account),
    // Extensões da Nero API
    profile: one(userProfiles, {
        fields: [user.id],
        references: [userProfiles.userId],
    }),
    addresses: many(userAddresses),
    paymentMethods: many(paymentMethods),
    wishlists: many(wishlists),
    cart: one(carts, {
        fields: [user.id],
        references: [carts.userId],
    }),
    orders: many(orders),
    reviews: many(productReviews),
}));

export const sessionRelations = relations(session, ({ one }) => ({
    user: one(user, {
        fields: [session.userId],
        references: [user.id],
    }),
}));

export const accountRelations = relations(account, ({ one }) => ({
    user: one(user, {
        fields: [account.userId],
        references: [user.id],
    }),
}));

// ════════════════════════════════════════════════════════════
//  PERFIL
// ════════════════════════════════════════════════════════════
export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
    user: one(user, {
        fields: [userProfiles.userId],
        references: [user.id],
    }),
}));

// ════════════════════════════════════════════════════════════
//  ENDEREÇOS
// ════════════════════════════════════════════════════════════
export const userAddressesRelations = relations(
    userAddresses,
    ({ one, many }) => ({
        user: one(user, {
            fields: [userAddresses.userId],
            references: [user.id],
        }),
        orders: many(orders),
    }),
);

// ════════════════════════════════════════════════════════════
//  MÉTODOS DE PAGAMENTO
// ════════════════════════════════════════════════════════════
export const paymentMethodsRelations = relations(
    paymentMethods,
    ({ one, many }) => ({
        user: one(user, {
            fields: [paymentMethods.userId],
            references: [user.id],
        }),
        orders: many(orders),
    }),
);

// ════════════════════════════════════════════════════════════
//  CATEGORIAS (self-referencing)
// ════════════════════════════════════════════════════════════
export const categoriesRelations = relations(categories, ({ one, many }) => ({
    parent: one(categories, {
        fields: [categories.parentId],
        references: [categories.id],
        relationName: 'category_parent',
    }),
    subcategories: many(categories, { relationName: 'category_parent' }),
    products: many(products),
}));

// ════════════════════════════════════════════════════════════
//  PRODUTOS
// ════════════════════════════════════════════════════════════
export const productsRelations = relations(products, ({ one, many }) => ({
    category: one(categories, {
        fields: [products.categoryId],
        references: [categories.id],
    }),
    variants: many(productVariants),
    images: many(productImages),
    reviews: many(productReviews),
    wishlistItems: many(wishlistItems),
    cartItems: many(cartItems),
    orderItems: many(orderItems),
}));

// ════════════════════════════════════════════════════════════
//  VARIANTES
// ════════════════════════════════════════════════════════════
export const productVariantsRelations = relations(
    productVariants,
    ({ one, many }) => ({
        product: one(products, {
            fields: [productVariants.productId],
            references: [products.id],
        }),
        images: many(productImages),
        cartItems: many(cartItems),
        orderItems: many(orderItems),
    }),
);

// ════════════════════════════════════════════════════════════
//  IMAGENS
// ════════════════════════════════════════════════════════════
export const productImagesRelations = relations(productImages, ({ one }) => ({
    product: one(products, {
        fields: [productImages.productId],
        references: [products.id],
    }),
    variant: one(productVariants, {
        fields: [productImages.variantId],
        references: [productVariants.id],
    }),
}));

// ════════════════════════════════════════════════════════════
//  REVIEWS
// ════════════════════════════════════════════════════════════
export const productReviewsRelations = relations(productReviews, ({ one }) => ({
    product: one(products, {
        fields: [productReviews.productId],
        references: [products.id],
    }),
    user: one(user, {
        fields: [productReviews.userId],
        references: [user.id],
    }),
    order: one(orders, {
        fields: [productReviews.orderId],
        references: [orders.id],
    }),
}));

// ════════════════════════════════════════════════════════════
//  WISHLIST
// ════════════════════════════════════════════════════════════
export const wishlistsRelations = relations(wishlists, ({ one, many }) => ({
    user: one(user, {
        fields: [wishlists.userId],
        references: [user.id],
    }),
    items: many(wishlistItems),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
    wishlist: one(wishlists, {
        fields: [wishlistItems.wishlistId],
        references: [wishlists.id],
    }),
    product: one(products, {
        fields: [wishlistItems.productId],
        references: [products.id],
    }),
}));

// ════════════════════════════════════════════════════════════
//  CUPONS
// ════════════════════════════════════════════════════════════
export const couponsRelations = relations(coupons, ({ many }) => ({
    carts: many(carts),
    orders: many(orders),
}));

// ════════════════════════════════════════════════════════════
//  CARRINHO
// ════════════════════════════════════════════════════════════
export const cartsRelations = relations(carts, ({ one, many }) => ({
    user: one(user, {
        fields: [carts.userId],
        references: [user.id],
    }),
    coupon: one(coupons, {
        fields: [carts.couponId],
        references: [coupons.id],
    }),
    items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
    cart: one(carts, {
        fields: [cartItems.cartId],
        references: [carts.id],
    }),
    product: one(products, {
        fields: [cartItems.productId],
        references: [products.id],
    }),
    variant: one(productVariants, {
        fields: [cartItems.variantId],
        references: [productVariants.id],
    }),
}));

// ════════════════════════════════════════════════════════════
//  PEDIDOS
// ════════════════════════════════════════════════════════════
export const ordersRelations = relations(orders, ({ one, many }) => ({
    user: one(user, {
        fields: [orders.userId],
        references: [user.id],
    }),
    coupon: one(coupons, {
        fields: [orders.couponId],
        references: [coupons.id],
    }),
    shippingAddress: one(userAddresses, {
        fields: [orders.shippingAddressId],
        references: [userAddresses.id],
    }),
    paymentMethod: one(paymentMethods, {
        fields: [orders.paymentMethodId],
        references: [paymentMethods.id],
    }),
    items: many(orderItems),
    reviews: many(productReviews),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
    product: one(products, {
        fields: [orderItems.productId],
        references: [products.id],
    }),
    variant: one(productVariants, {
        fields: [orderItems.variantId],
        references: [productVariants.id],
    }),
}));
