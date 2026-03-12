import type { FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { formatError, formatSuccess } from '@/shared/utils/response.util';

function shouldSkip(
    request: FastifyRequest,
    reply: FastifyReply,
    payload: string,
): boolean {
    const contentType = reply.getHeader('content-type');
    const isJson =
        typeof contentType === 'string' &&
        contentType.includes('application/json');
    const routeSchema = request.routeOptions?.schema as
        | { hide?: boolean }
        | undefined;

    return !isJson || !!routeSchema?.hide || !payload || payload === 'null';
}

function wrapPayload(
    request: FastifyRequest,
    reply: FastifyReply,
    payload: string,
): string {
    try {
        const parsed = JSON.parse(payload);

        const isWrapped =
            typeof parsed === 'object' &&
            parsed !== null &&
            'success' in parsed;
        const isAuthError =
            reply.statusCode === 401 || reply.statusCode === 403;

        if (isWrapped || isAuthError) {
            return payload;
        }

        if (reply.statusCode >= 400) {
            return JSON.stringify(
                formatError(
                    request.method,
                    parsed.message || 'Error processing request',
                    reply.statusCode,
                    parsed.code || 'UNKNOWN_ERROR',
                    parsed.error ? { details: parsed.error } : null,
                ),
            );
        }

        return JSON.stringify(
            formatSuccess(request.method, parsed, reply.statusCode),
        );
    } catch {
        return payload;
    }
}

export default fp(
    async (app) => {
        app.addHook(
            'onSend',
            (
                request: FastifyRequest,
                reply: FastifyReply,
                payload: string,
                done,
            ) => {
                if (shouldSkip(request, reply, payload)) {
                    return done(null, payload);
                }

                const result = wrapPayload(request, reply, payload);
                return done(null, result);
            },
        );
    },
    {
        name: 'response-wrapper',
    },
);
