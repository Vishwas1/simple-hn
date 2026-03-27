import { DynamicStructuredTool } from '@langchain/core/dist/tools';
import { weatherTool } from './weatherTool';

export function buildAgentTools(): DynamicStructuredTool[] {
  // This registry is the single place where tools are assembled.
  // Add/remove tool classes here without touching the agent logic.
  const tools = [weatherTool];

  const langchainTools: DynamicStructuredTool[] = [];
  for (const tool of tools) {
    langchainTools.push(tool);
  }
  return langchainTools;
}
