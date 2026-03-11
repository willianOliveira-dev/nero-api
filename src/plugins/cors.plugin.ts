import cors, { type FastifyCorsOptions } from '@fastify/cors';
import fp from 'fastify-plugin';
import { env } from '@/config/env';

export default fp<FastifyCorsOptions>(
  async (app) => {
    app.register(cors, {
      origin: env.NODE_ENV !== 'production' ? true : env.ALLOWED_ORIGINS,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders:       ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID', 'user-agent'],
      credentials: true,
      maxAge: 600,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });
  },
  {
    name: 'cors',
    fastify: '5.x',
  },
);