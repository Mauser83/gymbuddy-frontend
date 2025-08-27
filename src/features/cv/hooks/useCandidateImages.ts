import {useQuery} from '@apollo/client';
import {CANDIDATE_GLOBAL_IMAGES} from '../graphql/candidateImages.graphql';

export type CandidateImageFilters = {
  equipmentId: string;
  gymId?: string;
  status?: string;
  safety?: string;
  search?: string;
  limit?: number;
};

export function useCandidateImages(filters: CandidateImageFilters) {
  return useQuery(CANDIDATE_GLOBAL_IMAGES, {
    variables: filters,
    skip: !filters?.equipmentId,
    fetchPolicy: 'network-only',
  });
}