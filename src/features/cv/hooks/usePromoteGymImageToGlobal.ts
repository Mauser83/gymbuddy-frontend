import {useMutation} from '@apollo/client';
import {PROMOTE_GYM_IMAGE_TO_GLOBAL} from '../graphql/candidateImages.graphql';

export function usePromoteGymImageToGlobal() {
  const [mutate, result] = useMutation(PROMOTE_GYM_IMAGE_TO_GLOBAL);
  return {mutate, ...result};
}