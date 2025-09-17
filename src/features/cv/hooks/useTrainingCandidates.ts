import { useQuery } from '@apollo/client';

import {
  LIST_TRAINING_CANDIDATES,
  ListTrainingCandidatesInput,
} from '../graphql/trainingCandidates.graphql';

export function useTrainingCandidates(input: ListTrainingCandidatesInput) {
  return useQuery(LIST_TRAINING_CANDIDATES, {
    variables: { input },
    fetchPolicy: 'network-only',
    skip: !input?.gymId,
  });
}
