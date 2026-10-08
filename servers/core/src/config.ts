const getEnv = (key: string, fallback?: string): string => {
  const val = process.env[key] ?? fallback;
  if (val === undefined) throw new Error(`Missing required env var: ${key}`);
  return val;
};

export const config = {
  port: parseInt(getEnv("PORT", "3000"), 10),
  host: getEnv("HOST", "0.0.0.0"),
  nodeEnv: getEnv("NODE_ENV", "development"),
  isDev: process.env.NODE_ENV !== "production",
} as const;
