import type { FastifyPluginAsync } from "fastify";

const health: FastifyPluginAsync = async (fastify) => {
  fastify.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));
};

export default health;
