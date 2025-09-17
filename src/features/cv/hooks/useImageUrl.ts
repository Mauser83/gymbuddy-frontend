import { useQuery } from '@apollo/client';

import { IMAGE_URL } from '../graphql/imageUrl.graphql';

export function useImageUrl(storageKey: string | null, ttlSec: number) {
  const { data, loading, error, refetch } = useQuery(IMAGE_URL, {
    variables: { storageKey: storageKey ?? '', ttlSec },
    skip: !storageKey,
    fetchPolicy: 'no-cache',
  });

  return {
    url: data?.imageUrl?.url,
    expiresAt: data?.imageUrl?.expiresAt,
    loading,
    error,
    refetch,
  };
}

export default useImageUrl;
