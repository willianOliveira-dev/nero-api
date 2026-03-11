import type { FastifyInstance } from 'fastify';
import { authRoutes } from '@/modules/auth/routes/auth.routes';
import { authOpenApiRoutes } from '@/modules/auth/routes/auth-open-api.routes';

export async function registerRoutes(app: FastifyInstance) {
    await app.register(authOpenApiRoutes);
    await app.register(authRoutes);
}
