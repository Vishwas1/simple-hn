import dotenv from 'dotenv';
import { z } from 'zod';

// Load `.env` into `process.env` (no-op if it doesn't exist).
dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z.string().default('debug'),
  LOG_PRETTY: z.coerce.boolean().default(true),

  // Agent/LLM configuration
  LLM_PROVIDER: z.enum(['anthropic', 'openai', 'ollama']).default('ollama'),
  // Anthropic
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-3-5-sonnet-latest'),
  // OpenAIp
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-5-nano'),
  // Ollama
  OLLAMA_MODEL: z.string().default('llama3.1'),
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),

  // HuggingFace
  HUGGINGFACEHUB_API_KEY: z.string().optional(),
  HUGGINGFACE_MODEL: z.string().default('meta-llama/Llama-3.2-3B-Instruct'),

  // Supabase
  SUPABASE_AI_CMO_URL: z.string().optional(),
  SUPABASE_QUERYBRAIN_URL: z.string().optional(),
  SUPABASE_INGEST_URL: z.string().optional(),
  SUPABASE_INSERT_DOCUMENT_URL: z.string().optional(),
  SUPABASE_API_KEY: z.string().optional(),
  SUPABASE_ACCESS_TOKEN: z.string().optional(),
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:5174,http://127.0.0.1:5174'),
  SUPABASE_DB_CONNECTION_STRING: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);
