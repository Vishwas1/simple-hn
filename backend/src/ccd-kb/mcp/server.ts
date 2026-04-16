/* eslint-disable @typescript-eslint/no-explicit-any */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerQueryTool } from './tools/query.js';
import { registerPrompts } from './prompts/prompts.js';

export function getMcpServer(): McpServer {
  const mcpServer = new McpServer({
    name: 'concordium-knowledge-assistant',
    version: '0.1.0',
  });

  registerQueryTool(mcpServer);
  registerPrompts(mcpServer);

  return mcpServer;
}
