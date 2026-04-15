/* eslint-disable @typescript-eslint/no-explicit-any */

import fetch from 'node-fetch';
import { z } from 'zod';
// import { mcpServer } from '../server.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { formatEvidence } from './formatEvidence.js';
import { env } from '../../config/env.js';

const QUERY_API_URL = env.SUPABASE_QUERYBRAIN_URL!;
const API_KEY = env.SUPABASE_API_KEY!;
const ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN!;

type SoruceTypes = 'docs' | 'website' | 'paper' | 'confluence';
function getSourceTypes(
  audience?: 'business' | 'developer' | 'support',
  sourceTypesOverride?: Array<SoruceTypes>,
) {
  if (sourceTypesOverride && sourceTypesOverride.length > 0) {
    return sourceTypesOverride;
  }

  switch (audience) {
    case 'business':
      return ['website'];
    case 'developer':
      return ['docs', 'paper', 'confluence'];
    case 'support':
      return ['docs', 'confluence', 'website'];
    default:
      return ['docs', 'website'];
  }
}

async function makeNWSRequest<T>(url: string, body: any): Promise<T | null> {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    apikey: API_KEY,
  };

  try {
    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error('Error making NWS request:', error);
    return null;
  }
}

const InputSchema = z.object({
  question: z.string().min(1).describe('Query asked by the user'),
  mode: z.enum(['business', 'developer', 'support']).describe('The audience for the query'),
});
type Input = z.infer<typeof InputSchema>;

export function registerQueryTool(mcpServerInstance: McpServer) {
  mcpServerInstance.registerTool(
    'query_brain',
    {
      title: 'Query Brain',
      description: 'Search the Concordium knowledge base and return structured evidence',
      inputSchema: InputSchema,
    },
    async (args: Input) => {
      console.error('Received query_brain request with args:', args);
      console.error('Using QUERY_API_URL:', QUERY_API_URL);
      console.error('Using ACCESS_TOKEN:', !!ACCESS_TOKEN);
      console.error('Using API_KEY:', !!API_KEY);

      const { question, mode } = args;
      const finalSourceTypes = getSourceTypes(mode);
      const data = await makeNWSRequest(QUERY_API_URL, {
        question,
        source_types: finalSourceTypes,
      });
      const formatted = formatEvidence(data, mode);

      return {
        content: [
          {
            type: 'text',
            text: formatted,
          },
        ],
      };
    },
  );
}
