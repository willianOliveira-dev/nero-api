import type {
  FastifyError,
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '@/shared/errors/app.error';
import { formatError } from '@/shared/utils/response.util';

function handleValidationError(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const issues = error.validation?.map((v) => ({
    field:
      String(v.instancePath).replace('/', '') ||
      String(v.params?.missingProperty ?? 'unknown'),
    message: v.message ?? 'Erro de validação',
  }));

  return reply.status(400).send(
    formatError(request.method, 'Dados inválidos', 400, 'VALIDATION_ERROR', {
      issues: issues ?? [],
    }),
  );
}

function handleAppError(
  error: AppError,
  request: FastifyRequest,
  reply: FastifyReply,
  app: FastifyInstance,
) {
  if (error.statusCode >= 500) {
    app.log.error({ err: error, req: request.id }, error.message);
  }

  if (error.statusCode === 401 || error.statusCode === 403) {
    return reply.status(error.statusCode).send({
      code: error.code,
      message: error.message,
    });
  }

  return reply
    .status(error.statusCode)
    .send(
      formatError(
        request.method,
        error.message,
        error.statusCode,
        error.code,
        error.details,
      ),
    );
}

function handleFastifyError(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
  app: FastifyInstance,
) {
  if (error.statusCode === 401 || error.statusCode === 403) {
    return reply.status(error.statusCode).send({
      code: error.code ?? (error.statusCode === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN'),
      message: error.message,
    });
  }

  if (error.code === 'FST_ERR_RESPONSE_SERIALIZATION') {
    app.log.error(
      { err: error, req: request.id },
      'Schema/DB mismatch on response',
    );
    return reply
      .status(500)
      .send(
        formatError(
          request.method,
          'Erro interno do servidor',
          500,
          'INTERNAL_SERVER_ERROR',
        ),
      );
  }

  return reply
    .status(error.statusCode!)
    .send(
      formatError(
        request.method,
        error.message,
        error.statusCode || 500,
        error.code ?? 'FASTIFY_ERROR',
      ),
    );
}

export default fp(
  async (app) => {
    app.setErrorHandler((error: FastifyError, request, reply) => {
      if (error.validation) {
        return handleValidationError(error, request, reply);
      }

      if (error instanceof AppError) {
        return handleAppError(error, request, reply, app);
      }

      if (error.statusCode) {
        return handleFastifyError(error, request, reply, app);
      }

      app.log.error({ err: error, req: request.id }, 'Unhandled error');

      return reply
        .status(500)
        .send(
          formatError(
            request.method,
            'Erro interno do servidor',
            500,
            'INTERNAL_SERVER_ERROR',
          ),
        );
    });
  },
  {
    name: 'error-handler',
  },
);
