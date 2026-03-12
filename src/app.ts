import Fastify from 'fastify';
import {
    serializerCompiler,
    validatorCompiler,
    type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { env } from '@/config/env';
import { registerPlugins } from '@/plugins/index.plugin';
import { registerAppRouter } from './routes/root.routes';

export async function boostrap() {
    const app = Fastify({
        logger: {
            level: env.LOG_LEVEL ?? 'info',
            transport:
                env.NODE_ENV === 'dev'
                    ? {
                          target: 'pino-pretty',
                          options: {
                              localizeTime: true,
                              translateTime: 'HH:mm:ss Z dd-mm-yyyy',
                              colorize: true,
                          },
                      }
                    : undefined,
        },
        genReqId: () => crypto.randomUUID(),
        requestIdHeader: 'x-request-id',
    }).withTypeProvider<ZodTypeProvider>();

    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    await registerPlugins(app);
    await registerAppRouter(app);

    return app;
}
