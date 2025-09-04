import {useQuery} from '@apollo/client';
import {
  CANDIDATE_GLOBAL_IMAGES,
  CandidateGlobalImagesInput,
  AdminImageListStatus,
} from '../graphql/candidateImages.graphql';

export type CandidateImageFilters = {
  equipmentId: number | string;
  gymId?: number | string;
  status?: AdminImageListStatus;
  search?: string;
  limit?: number;
  safety?: {state?: 'PENDING' | 'COMPLETE' | 'FAILED'; flaggedOnly?: boolean};
};

export function useCandidateImages(filters: CandidateImageFilters) {
  const input: CandidateGlobalImagesInput = {
    equipmentId: Number(filters.equipmentId),
    limit: filters.limit ?? 50,
    ...(filters.gymId ? {gymId: Number(filters.gymId)} : {}),
    ...(filters.status ? {status: filters.status} : {}),
    ...(filters.search ? {search: filters.search} : {}),
    ...(filters.safety ? {safety: filters.safety} : {}),
  };

  return useQuery(CANDIDATE_GLOBAL_IMAGES, {
    variables: {input},
    skip: !filters?.equipmentId,
    fetchPolicy: 'network-only',
  });
}