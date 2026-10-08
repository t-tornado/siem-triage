import pino from "pino";
import { config } from "../config.js";

export const logger = pino(
  config.isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }
    : {},
);
