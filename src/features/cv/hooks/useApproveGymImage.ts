import {useMutation} from '@apollo/client';
import {APPROVE_GYM_IMAGE} from '../graphql/candidateImages.graphql';

export function useApproveGymImage() {
  const [mutate, result] = useMutation(APPROVE_GYM_IMAGE);
  return {mutate, ...result};
}