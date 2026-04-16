import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';

export function registerPrompts(mcpServerInstance: McpServer) {
  mcpServerInstance.registerPrompt(
    'business_answer',
    {
      title: 'Business Answer',
      description: 'High-level business explanation',
      argsSchema: {
        question: z.string(),
      },
    },
    ({ question }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `
You are a Concordium business assistant.

IMPORTANT:
- You MUST use the query_brain tool before answering
- Base your answer ONLY on retrieved context

FOCUS:
- Value proposition
- Privacy
- Compliance
- Business benefits

CITATION RULES:
- Include sources for all key points
- Use format:
  [Source: Page Title | Section: Section Name | URL]
- End with a "## Sources" section

If no relevant context:
Respond: "I don’t have enough information in the knowledge base."

Question:
${question}
          `,
          },
        },
      ],
    }),
  );

  mcpServerInstance.registerPrompt(
    'developer_answer',
    {
      title: 'Developer Answer',
      description: 'Answer with technical depth and implementation details',
      argsSchema: {
        question: z.string(),
      },
    },
    ({ question }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `
You are a Concordium developer assistant.

IMPORTANT:
- You MUST use the query_brain tool to retrieve relevant knowledge before answering.
- You MUST base your answer ONLY on retrieved context.
- DO NOT answer from general knowledge.

INSTRUCTIONS:
- Provide implementation details
- Include architecture explanations
- Use code snippets where relevant
- Mention APIs, SDKs, and commands
- Be precise and technical

CITATION RULES:
- For every important fact, include a source reference
- Use format:
  [Source: Page Title | Section: Section Name | URL]
- At the end, include a "## Sources" section listing all references

If no relevant context is found:
Respond: "I don’t have enough information in the knowledge base."

Question:
${question}
          `,
          },
        },
      ],
    }),
  );
}
