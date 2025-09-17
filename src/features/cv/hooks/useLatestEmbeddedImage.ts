import { useQuery } from '@apollo/client';

import { useRoleContext } from 'src/features/auth/context/RoleContext';

import { LATEST_EMBEDDED_IMAGE } from '../graphql/latestEmbeddedImage';

type Scope = 'GLOBAL' | 'GYM' | 'AUTO';
type Input = { scope: Scope; gymId?: number; equipmentId?: number };

export function useLatestEmbeddedImage(input: Input | null) {
  const role = useRoleContext();
  const activeGymId = role?.gymId ? Number(role.gymId) : undefined;

  const needsGym = input?.scope === 'GYM' || input?.scope === 'AUTO';
  const vars = input
    ? {
        input: {
          scope: input.scope,
          gymId: needsGym ? (input.gymId ?? activeGymId) : undefined,
          equipmentId: input.equipmentId,
        },
      }
    : undefined;

  const { data, loading, error } = useQuery(LATEST_EMBEDDED_IMAGE, {
    variables: vars,
    skip: !input || (needsGym && !(input.gymId ?? activeGymId)),
    fetchPolicy: 'no-cache',
  });

  return {
    latest: data?.getLatestEmbeddedImage ?? null,
    isLoading: loading,
    error,
  };
}
