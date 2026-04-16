/* eslint-disable @typescript-eslint/no-explicit-any */
import { DynamicStructuredTool, tool } from '@langchain/core/tools';
import { z } from 'zod';
import { env } from '../../config/env';
import fetch from 'node-fetch';

const QUERY_API_URL = env.SUPABASE_QUERYBRAIN_URL;
const API_KEY = env.SUPABASE_API_KEY;
const ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN;
type SourceType = 'docs' | 'website' | 'paper' | 'confluence';
interface QueryBrainArgs {
  question: string;
  source_types?: SourceType[];
}

interface QueryBrainResult {
  content: string;
  [key: string]: any;
}

interface QueryBrainResponse {
  question: string;
  source_types: SourceType[];
  results: QueryBrainResult[];
  top_context: string;
}

/**
 * QueryBrain: A dummy implementation of a tool that answers questions based on a knowledge base.
 */
export const query_brain: DynamicStructuredTool = tool(
  // 1. The Logic (Doer): What happens when the tool runs? This is the function that will be called when the tool is used.
  async ({ question, source_types }: QueryBrainArgs) => {
    console.log(`--- Tool Executing: Fetching information for "${question}" ---`);

    if (!QUERY_API_URL) {
      throw new Error('QUERY_API_URL environment variable is not set');
    }
    const res = await fetch(QUERY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        apikey: API_KEY || '',
      },
      body: JSON.stringify({ question, source_types }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Query API error: ${errText}`);
    }

    return (await res.json()) as QueryBrainResponse;
  },
  // 2. The Metadata (Manual): How does the AI know to use this?
  {
    name: 'query_brain',
    description:
      'Search the knowledge base. Use this tool whenever the question requires factual or domain-specific information. Always call this before answering.',
    schema: z.object({
      question: z.string().describe("The user's question to search in the knowledge base"),
      source_types: z.array(z.enum(['docs', 'website', 'paper', 'confluence'])).optional(),
    }),
  },
);
