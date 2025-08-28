import {useQuery} from '@apollo/client';
import {CANDIDATE_GLOBAL_IMAGES} from '../graphql/candidateImages.graphql';

export type CandidateImageFilters = {
  equipmentId: number | string;
  gymId?: string; // UI-only for now
  status?: 'CANDIDATE' | 'APPROVED' | 'REJECTED'; // UI-only for now
  search?: string;
  limit?: number;
};

export function useCandidateImages(filters: CandidateImageFilters) {
  const input = {
    equipmentId: Number(filters.equipmentId),
    limit: filters.limit ?? 50,
    ...(filters.search ? {search: filters.search} : {}),
  };

  return useQuery(CANDIDATE_GLOBAL_IMAGES, {
    variables: {input},
    skip: !filters?.equipmentId,
    fetchPolicy: 'network-only',
  });
}