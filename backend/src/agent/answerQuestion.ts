// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { DynamicStructuredTool } from 'langchain';
import {
  createToolCallingAgentExecutor,
  LLMProvider,
} from './runtime/createToolCallingAgentExecutor';

export interface IBaseAgent {
  tools: unknown;
  systemPrompt: string;
  llmProvider: LLMProvider;
}

export class BaseAgent implements IBaseAgent {
  tools: DynamicStructuredTool[];
  systemPrompt: string;
  llmProvider: LLMProvider;
  constructor(tools: DynamicStructuredTool[], systemPrompt: string, llmProvider: LLMProvider) {
    this.systemPrompt = systemPrompt;
    this.tools = tools;
    this.llmProvider = llmProvider;
  }

  private coerceAnswer(result: unknown): string {
    const r = result as any;
    if (typeof r === 'string') return r;
    if (typeof r?.output === 'string') return r.output;
    if (typeof r?.text === 'string') return r.text;
    return JSON.stringify(r, null, 2);
    // return this.formatLangchainResult(result);
  }

  async answersQuestion(question: string): Promise<string> {
    const executor = await createToolCallingAgentExecutor({
      tools: this.tools,
      llmProvider: this.llmProvider,
      systemPrompt: this.systemPrompt,
    });

    const result = await executor.invoke({
      messages: [{ role: 'human', content: question }],
    });

    return this.coerceAnswer(result);
  }
}
