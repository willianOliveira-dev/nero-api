import type { FastifyPluginAsyncZod, ZodTypeProvider } from 'fastify-type-provider-zod';

export const swaggerRoutes: FastifyPluginAsyncZod = async (app) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/swagger.json',
    schema: {
      operationId: 'getSwagger',
      hide: true,
    },
    handler: async () => {
      return app.swagger();
    },
  });
};
