import multipart, { type FastifyMultipartOptions } from '@fastify/multipart';
import fp from 'fastify-plugin';

export default fp<FastifyMultipartOptions>(
  async (app) => {
    app.register(multipart, {
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5,
        fieldSize: 1024 * 1024,
        fields: 10,
      },
      attachFieldsToBody: false,
    });
  },
  {
    name: 'multipart',
    fastify: '5.x',
  },
);
