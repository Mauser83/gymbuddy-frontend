import {useMutation} from '@apollo/client';
import {REJECT_GYM_IMAGE} from '../graphql/candidateImages.graphql';

export function useRejectGymImage() {
  const [mutate, result] = useMutation(REJECT_GYM_IMAGE);
  return {mutate, ...result};
}