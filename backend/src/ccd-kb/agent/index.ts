// Implement a singleton ConcordiumKnowledgeBaseAgent class that extends Agent class and
// can be used to get weather information for a given location.
import { BaseAgent } from '../../agent/answerQuestion';
import { SYSTEM_PROMPT } from '../prompts/ccdKbPrompt';
import { LLMProvider } from '../../agent/runtime/createToolCallingAgentExecutor';
import { buildAgentTools } from '../tools/toolRegistry';

export class ConcordiumKnowledgeBaseAgent extends BaseAgent {
  private static instance: ConcordiumKnowledgeBaseAgent;

  private constructor() {
    const tools = buildAgentTools();
    const systemPrompt = SYSTEM_PROMPT;
    const llmProvider: LLMProvider = 'openai';
    super(tools, systemPrompt, llmProvider);
  }

  public static getInstance(): ConcordiumKnowledgeBaseAgent {
    if (!ConcordiumKnowledgeBaseAgent.instance) {
      ConcordiumKnowledgeBaseAgent.instance = new ConcordiumKnowledgeBaseAgent();
    }
    return ConcordiumKnowledgeBaseAgent.instance;
  }
}

export default ConcordiumKnowledgeBaseAgent;
