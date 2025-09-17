import { useLazyQuery } from '@apollo/client';
import { useCallback } from 'react';

import { IMAGE_URL_MANY } from '../graphql/uploadSession.graphql';

export function useThumbUrls(options?: any) {
  const [load, { data, loading, error }] = useLazyQuery(IMAGE_URL_MANY, {
    fetchPolicy: 'no-cache',
    ...options,
  });

  const refresh = useCallback(
    (keys: string[], ttl?: number) => {
      if (keys.length) {
        load({ variables: { keys, ttlSec: ttl } });
      }
    },
    [load],
  );

  const patchUrls = useCallback((tiles: any[], results: any[]) => {
    const map = new Map(results.map((r: any) => [r.storageKey, r]));
    return tiles.map((t) => {
      const found = map.get(t.storageKey);
      return found ? { ...t, signedUrl: found.url, expiresAt: found.expiresAt } : t;
    });
  }, []);

  return { refresh, patchUrls, data, loading, error };
}
