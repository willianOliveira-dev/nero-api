import type { RouteHandler } from 'fastify';

export type ZodHandler<
  TParams = unknown,
  TBody = unknown,
  TQuery = unknown,
  TReply = any,
> = RouteHandler<{
  Params: TParams;
  Body: TBody;
  Querystring: TQuery;
  Reply: TReply;
}>;