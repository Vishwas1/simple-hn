// Implement a singleton WeatherAgent class that extends Agent class and
// can be used to get weather information for a given location.
import { BaseAgent } from '../../agent/answerQuestion';
import { LLMProvider } from '../../agent/runtime/createToolCallingAgentExecutor';
import { buildAgentTools } from '../tools/toolRegistry';

export class WeatherAgent extends BaseAgent {
  private static instance: WeatherAgent;

  private constructor() {
    const tools = buildAgentTools(); // add other weather-related tools here
    const systemPrompt = 'You are a helpful assistant that provides weather information.';
    const llmProvider: LLMProvider = 'ollama'; // or any other LLM provider you want to use
    super(tools, systemPrompt, llmProvider);
  }

  public static getInstance(): WeatherAgent {
    if (!WeatherAgent.instance) {
      WeatherAgent.instance = new WeatherAgent();
    }
    return WeatherAgent.instance;
  }
}

export default WeatherAgent;
