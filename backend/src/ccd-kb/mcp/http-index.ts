import http from 'node:http';
import { getMcpServer } from './server.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { env } from '../../config/env.js';
// const mcpServer = getMcpServer();

async function main() {
  const server = http.createServer(async (req, res) => {
    if (req.url?.startsWith('/mcp')) {
      console.error('🔥 MCP HIT:', req.method);

      try {
        // ✅ NEW server per session (safe approach)
        const mcpServer = getMcpServer();

        // ✅ NEW transport per request
        const transport = new StreamableHTTPServerTransport();

        await mcpServer.connect(transport);

        // ✅ ALWAYS call this
        await transport.handleRequest(req, res);
      } catch (err) {
        console.error('❌ MCP ERROR:', err);

        res.statusCode = 500;
        res.end('MCP error');
      }

      return;
    }

    res.statusCode = 404;
    res.end('Not Found');
  });

  server.listen(env.PORT, () => {
    console.log('🚀 MCP HTTP Server running on http://localhost:' + env.PORT);
  });
}

main();
