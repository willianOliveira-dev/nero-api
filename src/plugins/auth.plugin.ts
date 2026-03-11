import type { Session, User } from 'better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import type { FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { auth } from '@/lib/auth';
import { UnauthorizedError } from '@/shared/errors/app.error';

declare module 'fastify' {
  interface FastifyRequest {
    session: { user: User; session: Session };
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(
  async (app) => {
    app.decorate('authenticate', async (request: FastifyRequest, _: FastifyReply) => {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });

      if (!session) {
        throw new UnauthorizedError('Usuário não autenticado');
      }

      request.session = session;
    });
  },
  {
    name: 'auth',
  },
);
