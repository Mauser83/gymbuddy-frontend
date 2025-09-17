import { useMutation } from '@apollo/client';

import { APPROVE_TRAINING_CANDIDATE } from '../graphql/trainingCandidates.graphql';

export function useApproveTrainingCandidate() {
  const [mutate, result] = useMutation(APPROVE_TRAINING_CANDIDATE);
  return { mutate, ...result };
}
