/* eslint-disable @typescript-eslint/no-explicit-any */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// import { z } from 'zod';

export const mcpServer = new McpServer({
  name: 'concordium-knowledge-assistant',
  version: '0.1.0',
});
