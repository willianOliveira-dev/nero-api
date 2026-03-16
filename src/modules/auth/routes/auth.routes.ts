import { fromNodeHeaders } from 'better-auth/node';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { auth } from '@/lib/auth/auth.lib';

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  app.all('/api/auth/*', {
     schema: { hide: true },
  }, async (request, reply) => {
    const url = new URL(request.url, `${request.protocol}://${request.hostname}`).toString();
    const response = await auth.handler(
      new Request(url, {
        method: request.method,
        headers: fromNodeHeaders(request.headers),
        body: request.method === 'GET' ? null : JSON.stringify(request.body),
      }),
    );
    response.headers.forEach((value, key) => {
      reply.header(key, value);
    });

    return reply.status(response.status).send((await response.text()) || null);
  });
};
