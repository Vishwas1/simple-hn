/* eslint-disable @typescript-eslint/no-explicit-any */
import { env } from '../../config/env';
import { createAgent, DynamicStructuredTool, ReactAgent } from 'langchain'; // Standard v0.3+ entry point
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

export type LLMProvider = 'anthropic' | 'openai' | 'ollama' | 'huggingface';

function requireOrThrow(moduleName: string): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    return require(moduleName);
  } catch (e) {
    console.error(`Error loading module ${moduleName}:`, e);
    throw new Error(
      `Missing dependency: ${moduleName}. Run "npm i" in backend/ to install LangChain packages.`,
    );
  }
}

function getaLLMModelBasedOnAProvider({ provider }: { provider: LLMProvider }) {
  let model: BaseChatModel;

  switch (provider) {
    case 'anthropic': {
      const { ChatAnthropic } = requireOrThrow('@langchain/anthropic');

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
      const { ChatOpenAI } = requireOrThrow('@langchain/openai');

      if (!env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is required for OpenAI.');
      }

      model = new ChatOpenAI({
        modelName: env.OPENAI_MODEL,
        temperature: 0,
      });
      break;
    }

    case 'huggingface': {
      const { HuggingFaceInference } = requireOrThrow('@langchain/community/llms/hf');

      model = new HuggingFaceInference({
        model: env.HUGGINGFACE_MODEL, // Or any model on the Hub
        apiKey: env.HUGGINGFACEHUB_API_KEY,
        temperature: 0,
        maxTokens: 500,
      });
      break;
    }

    default: {
      const { ChatOllama } = requireOrThrow('@langchain/ollama');

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
