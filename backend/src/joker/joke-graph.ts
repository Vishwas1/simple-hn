import { Annotation, StateGraph, START, END, MemorySaver, interrupt } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { env } from '../config/env';

// 1. Define the State
// This is the "Shared Notepad" for our joke process
const JokeState = Annotation.Root({
  topic: Annotation<string>(),
  joke: Annotation<string>(),
  feedback: Annotation<string>(),
  isApproved: Annotation<boolean>(),
});

const llm = new ChatOpenAI({ model: 'gpt-4o', temperature: 0.7, apiKey: env.OPENAI_API_KEY });

// 2. Define the Nodes
// Node A: The Comedian
const comedianNode = async (state: typeof JokeState.State) => {
  console.log('--- Comedian is thinking ---');
  const response = await llm.invoke(`Tell a short joke about: ${state.topic}. 
    Previous feedback: ${state.feedback || 'None'}`);

  return { joke: response.content, isApproved: false };
};

// Node B: The Human Approval Node (This can actually be empty!)
// We use this as a "placeholder" where the graph will pause.
const humanReviewNode = async (state: typeof JokeState.State) => {
  console.log('--- Waiting for Human Review ---');
  //   // We don't do anything here; we'll let the "interrupt" handle the pause.
  //   // Example: If the human didn't provide feedback, but rejected the joke,
  //   // we can set a default message so the LLM knows why it's back.
  //   if (!state.isApproved && !state.feedback) {
  //     return { feedback: "The human didn't like the joke, try something different." };
  //   }
  //   return {};
  // This line pauses the graph and waits for a "Command" with a resume value
  const response = interrupt({
    question: 'Do you like this joke?',
    joke: state.joke,
  }) as { approved: boolean; feedback: string };

  return {
    isApproved: response.approved,
    feedback: response.feedback,
  };
};

// 3. Build the Graph
const workflow = new StateGraph(JokeState)
  .addNode('comedian', comedianNode)
  .addNode('human_review', humanReviewNode)

  .addEdge(START, 'comedian')
  .addEdge('comedian', 'human_review')

  // The logic: Should we go back to the comedian or end?
  .addConditionalEdges('human_review', (state) => {
    if (state.isApproved) return END;
    return 'comedian'; // Loop back if not approved
  });
// 4. Compile with a Checkpointer and Breakpoint
const checkpointer = new MemorySaver(); // This holds the "notepad" in memor

// 4. Compile with a "Breakpoint"
// This tells LangGraph: "Stop every time you reach the human_review node"
export const jokeGraph = workflow.compile({
  checkpointer,
});
