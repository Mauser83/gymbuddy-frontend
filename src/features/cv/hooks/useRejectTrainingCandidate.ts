import {useMutation} from '@apollo/client';
import {REJECT_TRAINING_CANDIDATE} from '../graphql/trainingCandidates.graphql';

export function useRejectTrainingCandidate() {
  const [mutate, result] = useMutation(REJECT_TRAINING_CANDIDATE);
  return {mutate, ...result};
}