import path from 'node:path';
import fastifyStatic from '@fastify/static';
import fp from 'fastify-plugin';

export default fp(
    async (app) => {
        const root = path.join(process.cwd(), 'public', 'static');
        app.register(fastifyStatic, {
            root,
            prefix: '/static/',
            setHeaders: (res) => {
                res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            },
        });
    },
    {
        name: 'static',
        fastify: '5.x',
    },
);
