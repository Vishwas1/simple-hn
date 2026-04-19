import { env } from '../../config/env';
import { ChatOpenAI } from '@langchain/openai';

const llm = new ChatOpenAI({ model: 'gpt-4o', temperature: 0.7, apiKey: env.OPENAI_API_KEY });
export { llm };
