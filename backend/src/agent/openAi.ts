/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from 'openai';
import fetch from 'node-fetch';
import { logger } from '../logger';
import { env } from '../config/env';
import { SYSTEM_PROMPT } from './openAiPrompt';

const QUERY_API_URL = env.SUPABASE_QUERYBRAIN_URL;
const API_KEY = env.SUPABASE_API_KEY;
const ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// -----------------------------
// Types
// -----------------------------

type SourceType = 'docs' | 'website' | 'paper' | 'confluence';

interface QueryBrainArgs {
  question: string;
  source_types?: SourceType[];
}

interface ToolCall {
  type: 'function_call';
  name: string;
  arguments: any;
  call_id: string;
}

interface ToolResult {
  type: 'function_call_output';
  call_id: string;
  output: string;
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

// -----------------------------
// Tools Definition
// -----------------------------

const tools: OpenAI.Responses.Tool[] = [
  {
    type: 'function',
    name: 'query_brain',
    description:
      'Search the knowledge base. Use this tool whenever the question requires factual or domain-specific information. Always call this before answering.',
    strict: false,
    parameters: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: "The user's question to search in the knowledge base",
        },
        source_types: {
          type: 'array',
          description: 'Optional sources to restrict search',
          items: {
            type: 'string',
            enum: ['docs', 'website', 'paper', 'confluence'],
          },
        },
      },
      required: ['question'],
    },
  },
];

// -----------------------------
// Tool
// -----------------------------

async function handleToolCall(toolCall: ToolCall): Promise<any> {
  if (toolCall.name === 'query_brain') {
    if (!QUERY_API_URL) {
      const error = 'QUERY_API_URL environment variable is not set';
      logger.error({ callId: toolCall.call_id }, error);
      throw new Error(error);
    }

    let parsedArgs: QueryBrainArgs;

    try {
      parsedArgs =
        typeof toolCall.arguments === 'string'
          ? JSON.parse(toolCall.arguments)
          : toolCall.arguments;
    } catch (err: any) {
      logger.error(
        { toolCall, error: err instanceof Error ? err.message : String(err) },
        'Failed to parse tool arguments',
      );
      throw new Error('Invalid tool arguments JSON');
    }

    const { question, source_types } = parsedArgs; //toolCall.arguments as QueryBrainArgs;
    logger.info(
      { callId: toolCall.call_id, question, sourceTypes: source_types },
      'Executing query_brain tool call',
    );

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
  }

  throw new Error(`Unknown tool: ${toolCall.name}`);
}

// -----------------------------
// Agent Runner
// -----------------------------

export async function runAgent(userInput: string): Promise<string> {
  const requestId = Math.random().toString(36).substring(7);
  logger.info({ requestId, userInput }, 'Starting agent execution');

  if (!env.SUPABASE_QUERYBRAIN_URL) {
    throw new Error('Query brain env is not set');
  }

  if (!env.SUPABASE_API_KEY || !env.SUPABASE_ACCESS_TOKEN) {
    throw new Error('Supabase credentials are not set');
  }

  try {
    // Track all sources from query_brain calls
    const allSources: Array<{ pageTitle: string; sectionTitle: string; url: string }> = [];

    let response = await openai.responses.create({
      model: 'gpt-4o',
      input: userInput,
      instructions: SYSTEM_PROMPT,
      tools,
    });

    logger.debug({ requestId, responseId: response.id }, 'Initial LLM response received');

    const MAX_ITERATIONS = 5;
    let iteration = 0;

    while (iteration < MAX_ITERATIONS) {
      iteration++;
      logger.debug({ requestId, iteration }, 'Starting iteration');

      // Extract tool calls safely
      const toolCalls = (response.output ?? []).filter(
        (item): item is ToolCall => item != null && (item as any).type === 'function_call',
      ) as ToolCall[];

      logger.debug(
        { requestId, iteration, toolCallCount: toolCalls.length },
        'Extracted tool calls',
      );

      // ✅ No tool calls → final answer
      if (toolCalls.length === 0) {
        const finalAnswer = response.output_text ?? 'No response generated.';

        // Append sources if any were collected
        if (allSources.length > 0) {
          const sourcesSection = formatSources(allSources);
          const answerWithSources = `${finalAnswer}\n\n${sourcesSection}`;
          logger.info(
            { requestId, iteration, sourceCount: allSources.length },
            'Final answer generated with sources',
          );
          return answerWithSources;
        }

        logger.info({ requestId, iteration }, 'Final answer generated, agent execution completed');
        return finalAnswer;
      }

      const toolResults: ToolResult[] = [];

      for (const toolCall of toolCalls) {
        try {
          logger.debug(
            { requestId, iteration, toolName: toolCall.name, callId: toolCall.call_id },
            'Executing tool call',
          );

          const result = await handleToolCall(toolCall);

          // Extract sources from query_brain results
          if (toolCall.name === 'query_brain' && result.results) {
            const extractedSources = (result.results as Array<any>)
              .filter((r) => r.source)
              .map((r) => ({
                pageTitle: r.source.pageTitle || 'Unknown',
                sectionTitle: r.source.sectionTitle || 'Unknown',
                url: r.source.canonical_url || r.source.url || 'Unknown',
                pageNumber: r.source.pageNumber || '0',
              }));

            allSources.push(...extractedSources);
            logger.debug(
              { requestId, iteration, extractedSourceCount: extractedSources.length },
              'Extracted sources from query_brain',
            );
          }

          logger.debug(
            { requestId, iteration, toolName: toolCall.name, callId: toolCall.call_id },
            'Tool call executed successfully',
          );

          toolResults.push({
            type: 'function_call_output',
            call_id: toolCall.call_id,
            output: JSON.stringify(result),
          });
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          logger.error(
            { requestId, iteration, toolName: toolCall.name, error },
            'Tool call failed',
          );

          toolResults.push({
            type: 'function_call_output',
            call_id: toolCall.call_id,
            output: JSON.stringify({
              error: 'Tool execution failed',
              details: error,
            }),
          });
        }
      }

      logger.debug(
        { requestId, iteration, resultCount: toolResults.length },
        'All tool results collected, sending back to LLM',
      );

      // Log tool results for debugging
      const toolResultsInfo = toolResults.map((tr) => {
        try {
          const parsed = JSON.parse(tr.output);
          return {
            callId: tr.call_id,
            outputLength: tr.output.length,
            hasSourceTypes: !!parsed.source_types,
            sourceTypes: parsed.source_types,
            resultCount: parsed.results?.length ?? 0,
            hasTopContext: !!parsed.top_context,
            error: parsed.error,
          };
        } catch {
          return {
            callId: tr.call_id,
            outputLength: tr.output.length,
          };
        }
      });

      logger.debug({ requestId, iteration, toolResultsInfo }, 'Tool results details with sources');

      // Send results back to LLM
      response = await openai.responses.create({
        model: 'gpt-4o',
        previous_response_id: response.id,
        tools,
        input: toolResults as any,
      });

      logger.debug({ requestId, iteration, newResponseId: response.id }, 'LLM response received');
    }

    // 🚨 Safety fallback
    const fallbackMessage = "Sorry, I couldn't complete the request due to too many steps.";
    logger.warn(
      { requestId, maxIterations: MAX_ITERATIONS, sourceCount: allSources.length },
      'Max iterations exceeded',
    );

    if (allSources.length > 0) {
      const sourcesSection = formatSources(allSources);
      return `${fallbackMessage}\n\n${sourcesSection}`;
    }

    return fallbackMessage;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logger.error({ requestId, error }, 'Agent execution failed with unexpected error');
    throw err;
  }
}

// Helper function to format sources
function formatSources(
  sources: Array<{ pageTitle: string; sectionTitle: string; url: string }>,
): string {
  if (!sources || sources.length === 0) {
    return '';
  }

  // Deduplicate sources by URL
  const uniqueSources = Array.from(new Map(sources.map((s) => [s.url, s])).values());

  const formattedSources = uniqueSources
    .map((source) => {
      if (source.sectionTitle && source.sectionTitle !== 'Unknown') {
        return `- [${source.pageTitle}](${source.url}) | Section: ${source.sectionTitle}`;
      }
      return `- [${source.pageTitle}](${source.url})`;
    })
    .join('\n');

  return `## Sources\n${formattedSources}`;
}
