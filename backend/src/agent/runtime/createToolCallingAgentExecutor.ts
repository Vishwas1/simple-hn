/* eslint-disable @typescript-eslint/no-explicit-any */
import { env } from '../../config/env';
import { createAgent, DynamicStructuredTool, ReactAgent } from 'langchain'; // Standard v0.3+ entry point
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOllama } from '@langchain/ollama';

export type LLMProvider = 'anthropic' | 'openai' | 'ollama' | 'huggingface';

function getaLLMModelBasedOnAProvider({ provider }: { provider: LLMProvider }) {
  let model: BaseChatModel;

  switch (provider) {
    case 'anthropic': {
      if (!env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is required for Claude.');
      }

      model = new ChatAnthropic({
        model: env.ANTHROPIC_MODEL,
        temperature: 0,
      });
      break;
    }

    case 'openai': {
      if (!env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is required for OpenAI.');
      }

      model = new ChatOpenAI({
        modelName: env.OPENAI_MODEL,
        temperature: 1,
      });
      break;
    }

    default: {
      model = new ChatOllama({
        baseUrl: 'http://192.168.1.2:11434', // Default Ollama port
        model: 'gpt-oss:20b', // Ensure you pulled this in terminal
        verbose: true,
      });
    }
  }

  return model;
}

export async function createToolCallingAgentExecutor({
  tools,
  llmProvider = 'ollama',
  systemPrompt = 'You are a helpful assistant ',
}: {
  tools: DynamicStructuredTool[];
  llmProvider: LLMProvider;
  systemPrompt: string;
}): Promise<ReactAgent> {
  // 1. Setup the specific model
  const model: BaseChatModel = getaLLMModelBasedOnAProvider({ provider: llmProvider });

  /**
   * 2. Initialize the Agent
   * In latest LangChain, createAgent creates a "Runnable"
   * that manages the loop: Look at prompt -> Choose Tool -> Run Tool -> Repeat.
   */
  const agent = createAgent({
    model: model,
    tools: tools,
    systemPrompt,
  });

  return agent;
}
