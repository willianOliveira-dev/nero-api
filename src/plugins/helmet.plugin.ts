import helmet, { type FastifyHelmetOptions } from '@fastify/helmet';
import fp from 'fastify-plugin';
export default fp<FastifyHelmetOptions>(
  async (app) => {
    app.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
          scriptSrc: ["'self'", "'unsafe-inline'", 'validator.swagger.io'],
        },
      },
      frameguard: {
        action: 'deny',
      },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31_536_000,
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    });
  },
  {
    name: 'helmet',
    fastify: '5.x',
  },
);
