import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../lib/errors/index.js";

export function errorHandler(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  if (error instanceof AppError) {
    reply.log.info({ err: error, context: error.context }, error.message);
    return reply.status(error.statusCode).send({
      error: error.name,
      message: error.message,
    });
  }

  reply.log.error({ err: error }, "Unhandled error");
  return reply.status(500).send({
    error: "InternalServerError",
    message: "An unexpected error occurred",
  });
}
