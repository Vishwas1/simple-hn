import { StateGraph, START, END, MemorySaver } from '@langchain/langgraph';
import { CMOState } from './state';
import { strategistNode } from './nodes/strategist';
import { humanReviewNode } from './nodes/humanReview';
import { writerNode } from './nodes/writer';
import { seoNode } from './nodes/seo';

const workflow = new StateGraph(CMOState)
  .addNode('strategist', strategistNode)
  .addNode('human_review', humanReviewNode)
  .addNode('seo_agent', seoNode) // 1. A
  .addNode('writer', writerNode)

  // Define the path
  .addEdge(START, 'strategist')
  .addEdge('strategist', 'human_review')

  // The decision point
  .addConditionalEdges('human_review', (state) => {
    if (state.isApproved) return 'seo_agent';
    return 'strategist'; // Loop back to planning if rejected
  })

  // 3. After SEO is done with all tasks, go to the Writer loop
  .addEdge('seo_agent', 'writer')

  .addConditionalEdges('writer', (state) => {
    const nextTask = state.tasks.find((t) => t.status === 'pending');
    if (nextTask) {
      return 'writer'; // Loop back to the same node for the next task
    }
    return END; // All tasks done!
  });

export const cmoGraph = workflow.compile({
  checkpointer: new MemorySaver(),
});
