import { mcpServer } from '../server.js';
import { z } from 'zod';

mcpServer.registerPrompt(
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

Answer in a high-level, non-technical way.
Focus on:
- value proposition
- privacy
- compliance
- business benefits

Question:
${question}
          `,
        },
      },
    ],
  }),
);

mcpServer.registerPrompt(
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

Instructions:
- Provide implementation details
- Include architecture explanations
- Use code snippets where relevant
- Mention APIs, SDKs, and commands when applicable
- Be precise and technical
- Avoid high-level marketing language

Question:
${question}
          `,
        },
      },
    ],
  }),
);
