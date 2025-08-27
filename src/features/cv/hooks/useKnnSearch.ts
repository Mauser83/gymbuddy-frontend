import {useQuery} from '@apollo/client';
import {KNN_SEARCH} from '../graphql/knnSearch';
import {useRoleContext} from 'features/auth/context/RoleContext';

export type Input = {
  imageId: string;
  scope: 'GLOBAL' | 'GYM';
  limit: number;
  gymId?: number;
};

export function useKnnSearch(input: Input | null) {
  const role = useRoleContext();
  const activeGymId = role?.gymId ? Number(role.gymId) : undefined;

  const shouldRun = Boolean(input?.imageId && input?.scope);
  const {data, loading, error} = useQuery(KNN_SEARCH, {
    variables: shouldRun
      ? {
          input: {
            imageId: input!.imageId,
            scope: input!.scope,
            limit: input!.limit,
            gymId:
              input!.scope === 'GYM'
                ? input!.gymId ?? activeGymId
                : undefined,
          },
        }
      : undefined,
    skip:
      !shouldRun ||
      (input?.scope === 'GYM' && !(input?.gymId ?? activeGymId)),
    fetchPolicy: 'no-cache',
  });

  const neighbors = data?.knnSearch ?? [];
  return {neighbors, isLoading: loading, error};
}
