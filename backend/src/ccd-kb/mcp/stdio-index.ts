import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getMcpServer } from './server.js';

async function main() {
  const transport = new StdioServerTransport();
  const mcpServer = getMcpServer();
  await mcpServer.connect(transport);
  console.error('MCP server is running and connected via stdio transport');
}

main().catch((err) => {
  console.error('MCP server failed to start:', err);
  process.exit(1);
});
