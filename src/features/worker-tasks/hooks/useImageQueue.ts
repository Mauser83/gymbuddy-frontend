import {useLazyQuery, useQuery} from '@apollo/client';
import {useEffect} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import {IMAGE_JOBS, IMAGE_URL_MANY} from '../graphql/queue.graphql';
import type {
  ImageJobStatus,
  ImageJobType,
  ImageQueueItem,
  ImageJobGroup,
} from '../types';

interface Filters {
  status: ImageJobStatus[];
  jobType: ImageJobType[];
  query: string;
  limit?: number;
}

interface Options {
  pollMs?: number;
  pauseOnHidden?: boolean;
}

export const useImageQueue = (
  filters: Filters,
  options?: Options,
) => {
  const pollMs = options?.pollMs ?? 10000;

  const singleStatus =
    Array.isArray(filters.status) && filters.status.length === 1
      ? filters.status[0]
      : null;

  const {data, loading, error, refetch, startPolling, stopPolling} = useQuery<{
    imageJobs: ImageQueueItem[];
  }>(IMAGE_JOBS, {
    variables: {status: singleStatus, limit: filters.limit ?? 50},
    pollInterval: options?.pauseOnHidden ? 0 : pollMs,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    if (!options?.pauseOnHidden) return;

    const doc: any = (globalThis as any).document;
    const handleVisibility = () => {
      if (doc?.visibilityState === 'visible') {
        startPolling(pollMs);
      } else {
        stopPolling();
      }
    };

    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        startPolling(pollMs);
      } else {
        stopPolling();
      }
    };

    handleVisibility();
    doc?.addEventListener?.('visibilitychange', handleVisibility);
    const subscription = AppState.addEventListener('change', handleAppState);
    return () => {
      doc?.removeEventListener?.('visibilitychange', handleVisibility);
      subscription.remove();
    };
  }, [pollMs, startPolling, stopPolling, options?.pauseOnHidden]);

  const raw: ImageQueueItem[] = data?.imageJobs ?? [];

  const normalized = raw.map(r => ({
    ...r,
    jobType: (r.jobType || '').toLowerCase() as any,
  }));

  const byType =
    filters.jobType?.length
      ? normalized.filter(r => filters.jobType.includes(r.jobType as any))
      : normalized;

  const q = (filters.query ?? '').trim().toLowerCase();
  const items = q
    ? byType.filter(r =>
        (r.id ?? '').toLowerCase().includes(q) ||
        (r.imageId ?? '').toLowerCase().includes(q) ||
        (r.storageKey ?? '').toLowerCase().includes(q) ||
        (r.lastError ?? '').toLowerCase().includes(q),
      )
    : byType;

  // —— Group by (imageId || storageKey) ————————————————
  const groupsMap = new Map<string, ImageJobGroup>();
  for (const it of items) {
    const key = it.imageId ?? (it.storageKey ? `sk:${it.storageKey}` : `bad:${it.id}`);
    let g = groupsMap.get(key);
    if (!g) {
      g = {key, imageId: it.imageId ?? null, storageKey: it.storageKey ?? null, jobs: {}};
      groupsMap.set(key, g);
    }
    const jt = it.jobType as ImageJobType;
    if (!g.jobs[jt]) g.jobs[jt] = it; // first occurrence wins
  }
  const groups = Array.from(groupsMap.values());

  // —— Batch-sign unique storageKeys for thumbnails ——————————
  const skList = Array.from(new Set(groups.map(g => g.storageKey).filter(Boolean))) as string[];
  const [fetchMany, {data: signedData}] = useLazyQuery(IMAGE_URL_MANY, {fetchPolicy: 'network-only'});
  useEffect(() => {
    if (skList.length) fetchMany({variables: {keys: skList}});
  }, [fetchMany, skList.join('|')]);

  const signedMap: Record<string, string> = {};
  (signedData?.imageUrlMany || []).forEach((r: {storageKey: string; url: string}) => {
    signedMap[r.storageKey] = r.url;
  });

  const total = items.length;

  return {
    items,
    groups,
    thumbs: signedMap,
    total,
    loading,
    error,
    refetch,
  } as const;
};