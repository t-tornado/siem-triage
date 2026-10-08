import "dotenv/config";
import { buildServer } from "./server.js";
import { config } from "./config.js";

async function main() {
  const server = await buildServer();

  for (const signal of ["SIGTERM", "SIGINT"]) {
    process.on(signal, async () => {
      await server.close();
      process.exit(0);
    });
  }

  try {
    await server.listen({ port: config.port, host: config.host });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
