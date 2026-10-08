import type { FastifyInstance } from "fastify";
import health from "./modules/health/index.js";

export async function registerRoutes(server: FastifyInstance) {
  await server.register(health);
}
