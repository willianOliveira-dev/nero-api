import type { FastifyInstance } from 'fastify';
import { addressesRoutes } from '@/modules/addresses/routes/addresses.routes';
import { authRoutes } from '@/modules/auth/routes/auth.routes';
import { authOpenApiRoutes } from '@/modules/auth/routes/auth-open-api.routes';
import { categoriesRoutes } from '@/modules/categories/routes/categories.routes';
import { productsRoutes } from '@/modules/products/routes/products.routes';
import { usersRoutes } from '@/modules/users/routes/users.routes';
import { swaggerRoutes } from '@/modules/swagger/routes/swagger.routes';

export async function registerAppRouter(app: FastifyInstance): Promise<void> {
    await app.register(swaggerRoutes)
    await app.register(authOpenApiRoutes);
    await app.register(authRoutes);

    await app.register(usersRoutes, { prefix: '/api/v1/' });
    await app.register(productsRoutes, { prefix: '/api/v1/' });
    await app.register(categoriesRoutes, { prefix: '/api/v1/' });
    await app.register(addressesRoutes, { prefix: '/api/v1/' });
}
