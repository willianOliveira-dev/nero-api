import rateLimit, { type FastifyRateLimitOptions } from '@fastify/rate-limit';
import fp from 'fastify-plugin';
import { env } from '@/config/env';

export default fp<FastifyRateLimitOptions>(
    async (app) => {
        app.register(rateLimit, {
            timeWindow: '1 minute',

            max: env.NODE_ENV !== 'production' ? 1000 : 100,

            errorResponseBuilder: (_request, context) => ({
                statusCode: 429,
                error: 'Muitos pedidos',
                message: `Limite de requisições excedido. Tente novamente em ${context.after}`,
                retryAfter: context.after,
            }),

            addHeaders: {
                'x-ratelimit-limit': true,
                'x-ratelimit-remaining': true,
                'x-ratelimit-reset': true,
                'retry-after': true,
            },

            allowList: (request, _key) => {
                if (env.NODE_ENV === 'dev') {
                    return true;
                }
                const allowedPaths = ['/health', '/metrics'];
                return allowedPaths.includes(request.url);
            },
        });
    },
    {
        name: 'rate-limit',
        fastify: '5.x',
    },
);
