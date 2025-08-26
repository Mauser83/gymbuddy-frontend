import {useEffect, useMemo} from 'react';
import {useLazyQuery} from '@apollo/client';
import {KnnSearchDocument} from '../graphql/knnSearch';
import {useThumbUrls} from 'features/cv/hooks/useThumbUrls';

export interface KnnSearchInput {
  imageId?: string;
  vector?: number[];
  scope: string;
  limit?: number;
}

interface Neighbor {
  imageId: string;
  equipmentId: string | null;
  score: number;
  storageKey: string;
}

export function useKnnSearch(input: KnnSearchInput | null) {
  const [runSearch, {data, loading, error}] = useLazyQuery<{
    knnSearch: Neighbor[];
  }>(KnnSearchDocument, {
    fetchPolicy: 'no-cache',
  });

  useEffect(() => {
    if (input) {
      runSearch({variables: {input}});
    }
  }, [runSearch, input && JSON.stringify(input)]);

  const keys = useMemo(
    () => (data?.knnSearch ? data.knnSearch.map(n => n.storageKey) : []),
    [data],
  );

  const {
    refresh,
    data: urlData,
    loading: urlLoading,
    error: urlError,
  } = useThumbUrls();

  useEffect(() => {
    if (keys.length) {
      refresh(keys);
    }
  }, [keys, refresh]);

  const thumbMap = useMemo(() => {
    const map = new Map<string, string>();
    const results = (urlData as any)?.imageUrlMany ?? [];
    results.forEach((r: any) => {
      map.set(r.storageKey, r.url);
    });
    return map;
  }, [urlData]);

  const thumbs = useMemo(() => {
    return data?.knnSearch?.map(n => thumbMap.get(n.storageKey) ?? null) ?? [];
  }, [data, thumbMap]);

  return {
    neighbors: data?.knnSearch ?? [],
    thumbs,
    error: error || urlError,
    isLoading: loading || urlLoading,
  };
}