import {useQuery} from '@apollo/client';
import {useEffect} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import {IMAGE_JOBS} from '../graphql/queue.graphql';
import type {
  ImageJobStatus,
  ImageJobType,
  ImageQueueItem,
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
    jobType: (r.jobType || '').toLowerCase(),
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
  const total = items.length;

  return {items, total, loading, error, refetch} as const;
};