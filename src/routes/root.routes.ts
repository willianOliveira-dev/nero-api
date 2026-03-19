import type { FastifyInstance } from 'fastify';
import { addressesRoutes } from '@/modules/addresses/routes/addresses.routes';
import { authRoutes } from '@/modules/auth/routes/auth.routes';
import { authOpenApiRoutes } from '@/modules/auth/routes/auth-open-api.routes';
import { brandsRoutes } from '@/modules/brands/routes/brands.routes';
import { cartRoutes } from '@/modules/cart/routes/cart.routes';
import { categoriesRoutes } from '@/modules/categories/routes/categories.routes';
import { homeRoutes } from '@/modules/home/routes/home.routes';
import { ordersRoutes } from '@/modules/orders/routes/orders.routes';
import { productsRoutes } from '@/modules/products/routes/products.routes';
import { reviewsRoutes } from '@/modules/reviews/routes/reviews.routes';
import { swaggerRoutes } from '@/modules/swagger/routes/swagger.routes';
import { usersRoutes } from '@/modules/users/routes/users.routes';
import { wishlistRoutes } from '@/modules/wishlist/routes/wishlist.routes';
import { paymentsRoutes } from '@/modules/payments/routes/payments.routes';

export async function registerAppRouter(app: FastifyInstance): Promise<void> {
    await app.register(swaggerRoutes);
    await app.register(authOpenApiRoutes);
    await app.register(authRoutes);

    await app.register(homeRoutes, { prefix: '/api/v1/' });
    await app.register(usersRoutes, { prefix: '/api/v1/' });
    await app.register(addressesRoutes, { prefix: '/api/v1/' });
    await app.register(productsRoutes, { prefix: '/api/v1/' });
    await app.register(brandsRoutes, { prefix: '/api/v1/' });
    await app.register(reviewsRoutes, { prefix: '/api/v1/' });
    await app.register(categoriesRoutes, { prefix: '/api/v1/' });
    await app.register(cartRoutes, { prefix: '/api/v1/' });
    await app.register(ordersRoutes, { prefix: '/api/v1/' });
    await app.register(wishlistRoutes, { prefix: '/api/v1/' });
    await app.register(paymentsRoutes, { prefix: '/api/v1/' });
}
