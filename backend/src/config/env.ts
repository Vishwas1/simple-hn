import dotenv from 'dotenv';
import { z } from 'zod';

// Load `.env` into `process.env` (no-op if it doesn't exist).
dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z.string().default('info'),
  LOG_PRETTY: z.coerce.boolean().default(true),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);
