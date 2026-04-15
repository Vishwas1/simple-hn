import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { mcpServer } from './server.js';
import './tools/query.js';
import './prompts/prompts.js';

async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error('MCP server is running and connected via stdio transport');
}

main().catch((err) => {
  console.error('MCP server failed to start:', err);
  process.exit(1);
});
