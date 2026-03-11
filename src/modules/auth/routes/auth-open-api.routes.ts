import type { FastifyPluginAsyncZod, ZodTypeProvider } from 'fastify-type-provider-zod';
import { auth } from '@/lib/auth/auth.lib';

export const authOpenApiRoutes: FastifyPluginAsyncZod = async (app) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/api/auth/open-api/generate-schema',
    schema: {
      operationId: 'generateOpenApiSchema',
      hide: true,
    },
    handler: async () => {
      const openApiSchema = await auth.api.generateOpenAPISchema();
      return openApiSchema;
    },
  });
};
