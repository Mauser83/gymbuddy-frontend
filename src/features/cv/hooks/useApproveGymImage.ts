import {useMutation} from '@apollo/client';
import {APPROVE_GYM_IMAGE} from '../graphql/candidateImages.graphql';

export function useApproveGymImage() {
  const [mutate, result] = useMutation(APPROVE_GYM_IMAGE, {
    update(cache, {data}) {
      const gi = data?.approveGymImage?.gymImage;
      if (!gi) return;
      cache.modify({
        id: cache.identify({__typename: 'GymEquipmentImage', id: gi.id}),
        fields: {
          status() {
            return gi.status;
          },
          approvedAt() {
            return gi.approvedAt;
          },
          approvedBy() {
            return gi.approvedBy;
          },
        },
      });
    },
  });
  return {mutate, ...result};
}