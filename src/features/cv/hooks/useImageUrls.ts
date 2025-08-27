import {useEffect, useCallback, useState} from 'react';
import {useLazyQuery} from '@apollo/client';
import {IMAGE_URL_MANY} from '../graphql/uploadSession.graphql';

export function useImageUrls(storageKeys: string[], ttlSec = 600) {
  const [load, {data, loading, error}] = useLazyQuery(IMAGE_URL_MANY, {
    fetchPolicy: 'no-cache',
  });
  const [urlByKey, setUrlByKey] = useState<Map<string, string>>(new Map());

  const refresh = useCallback(
    (keys: string[]) => {
      if (keys.length) {
        load({variables: {keys, ttlSec}});
      }
    },
    [load, ttlSec],
  );

  useEffect(() => {
    if (storageKeys?.length) {
      refresh(storageKeys);
    }
  }, [storageKeys, refresh]);

  useEffect(() => {
    if (data?.imageUrlMany) {
      setUrlByKey(prev => {
        const next = new Map(prev);
        data.imageUrlMany.forEach((r: any) => next.set(r.storageKey, r.url));
        return next;
      });
    }
  }, [data]);

  return {urlByKey, loading, error, refresh};
}