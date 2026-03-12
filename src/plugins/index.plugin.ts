import type { FastifyInstance } from 'fastify';
import authPlugin from '@/plugins/auth.plugin';
import corsPlugin from '@/plugins/cors.plugin';
import helmetPlugin from '@/plugins/helmet.plugin';
import multipartPlugin from '@/plugins/multipart.plugin';
import rateLimitPlugin from '@/plugins/rate-limit.plugin';
import responseWrapperPlugin from '@/plugins/response-wrapper.plugin';
import staticPlugin from '@/plugins/static.plugin';
import swaggerPlugin from '@/plugins/swagger.plugin';

export async function registerPlugins(app: FastifyInstance) {
    await app.register(corsPlugin);
    await app.register(helmetPlugin);
    await app.register(rateLimitPlugin);
    await app.register(multipartPlugin);
    await app.register(responseWrapperPlugin);

    await app.register(authPlugin);
    await app.register(staticPlugin);
    await app.register(swaggerPlugin);
}
