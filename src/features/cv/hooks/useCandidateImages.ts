import {useQuery} from '@apollo/client';
import {CANDIDATE_GLOBAL_IMAGES} from '../graphql/candidateImages.graphql';

export type CandidateImageFilters = {
  equipmentId: number | string;
  gymId?: number | string;
  status?: 'CANDIDATE' | 'APPROVED' | 'REJECTED';
  search?: string;
  limit?: number;
  safety?: {state?: 'PENDING' | 'COMPLETE' | 'FAILED'; flaggedOnly?: boolean};
};

export function useCandidateImages(filters: CandidateImageFilters) {
  const input: any = {
    equipmentId: Number(filters.equipmentId),
    limit: filters.limit ?? 50,
    ...(filters.gymId ? {gymId: Number(filters.gymId)} : {}),
    ...(filters.search ? {search: filters.search} : {}),
    ...(filters.safety ? {safety: filters.safety} : {}),
    // IMPORTANT: don't send the UI bucket "CANDIDATE" to server
    ...(filters.status && filters.status !== 'CANDIDATE'
      ? {status: filters.status}
      : {}),
  };

  return useQuery(CANDIDATE_GLOBAL_IMAGES, {
    variables: {input},
    skip: !filters?.equipmentId,
    fetchPolicy: 'network-only',
  });
}