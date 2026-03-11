import swagger from '@fastify/swagger';
import scalarApiReference from '@scalar/fastify-api-reference';
import fp from 'fastify-plugin';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import { env } from '@/config/env';

export default fp(
  async (app) => {
    await app.register(swagger, {
      openapi: {
        openapi: '3.1.0',
        info: {
          title: 'Nero API',
          description:
            'A Nero API é uma interface RESTful robusta projetada especificamente para o varejo de moda online. Ela oferece controle total sobre o ciclo de vida do produto, desde a entrada de estoque em múltiplas variantes (SKUs) até o processamento final do checkout. Ideal para marketplaces, lojas boutique ou aplicativos móveis de moda.',
          license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
          },
          version: env.API_VERSION ?? '1.0.0',
          contact: {
            name: 'Willian Oliveira',
            email: 'willian.dev.tech@gmail.com',
          },
        },
        servers: [
          {
            url: `http://localhost:${env.PORT}`,
            description: 'Localhost',
          },
          {
            url: 'https://api.example.com',
            description: 'Production',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        tags: [{ name: 'Users', description: 'User management' }],
      },

      transform: jsonSchemaTransform,
    });

    await app.register(scalarApiReference, {
      routePrefix: '/docs',
      configuration: {
        sources: [
          {
            title: 'Nero API',
            slug: 'nero-api',
            url: '/swagger.json',
          },
          {
            title: 'Auth API',
            slug: 'auth-api',
            url: '/api/auth/open-api/generate-schema',
          },
        ],
        content: () => app.swagger(),
        showSidebar: true,
        hideDownloadButton: false,
        theme: 'elysiajs',
      },
    });
  },
  {
    name: 'swagger',
    fastify: '5.x',
  },
);
