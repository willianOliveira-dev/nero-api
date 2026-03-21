import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

export const healthRoutes: FastifyPluginAsyncZod = async (app) => {
    app.get('/health', {
        schema: {
            tags: ['System'],
            summary: 'Operação de verificação de integridade',
            operationId: 'checkHealth',
            response: {
                200: z.object({ status: z.literal('ok') })
            },
        },
        handler: async () => ({ status: 'ok' as const }),
    });
};
