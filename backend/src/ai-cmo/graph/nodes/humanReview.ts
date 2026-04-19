import { interrupt } from '@langchain/langgraph';
import { CMOState } from '../state';

export const humanReviewNode = async (state: typeof CMOState.State) => {
  console.log('--- System: Waiting for Human approval ---');

  // The execution pauses here.
  // When you resume via the API, the value passed to Command({ resume: ... })
  // becomes the return value of this interrupt function.
  const response = interrupt({
    message: 'The strategy is ready for your review.',
    plan: state.plan,
    tasks: state.tasks, // Good to show the human the tasks too!
  }) as { approved: boolean; feedback?: string };

  console.log('--- System: Received Human Input ---', response);

  // We return these to update the CMOState
  return {
    isApproved: response.approved === true,
    feedback: response.feedback || '',
  };
};
