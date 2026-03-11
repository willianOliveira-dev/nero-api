import { env } from '@/config/env';
import { boostrap } from './app';

async function server() {
    const app = await boostrap();

    const shutdown = async (signal: string) => {
        app.log.info(`Received ${signal}. Shutting down...`);
        await app.close();
        process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    try {
        await app.listen({
            port: env.PORT,
            host: env.HOST,
        });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

server();
