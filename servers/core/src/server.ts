import Fastify from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import { config } from "./config.js";
import { registerRoutes } from "./routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export async function buildServer() {
  const server = Fastify({
    logger: config.isDev
      ? {
          transport: {
            target: "pino-pretty",
            options: { colorize: true },
          },
        }
      : true,
  });

  await server.register(helmet);
  await server.register(cors);
  await server.register(sensible);

  server.setErrorHandler(errorHandler);

  await registerRoutes(server);

  return server;
}
