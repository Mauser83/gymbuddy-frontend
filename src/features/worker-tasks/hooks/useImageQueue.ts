import {useQuery} from '@apollo/client';
import {useEffect, useState} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import {
  IMAGE_QUEUE,
} from '../graphql/queue.graphql';
import type {
  ImageJobStatus,
  ImageJobType,
  ImageQueueResponse,
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
  const [offset, setOffset] = useState(0);
  const pollMs = options?.pollMs ?? 10000;

  const {data, loading, error, refetch, startPolling, stopPolling} = useQuery<{
    imageQueue: ImageQueueResponse;
  }>(IMAGE_QUEUE, {
    variables: {...filters, offset, limit: filters.limit ?? 50},
    pollInterval: options?.pauseOnHidden ? 0 : pollMs,
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

  const items = data?.imageQueue?.items ?? [];
  const total = data?.imageQueue?.total ?? 0;

  return {
    data,
    items,
    total,
    loading,
    error,
    refetch,
    setOffset,
    offset,
  } as const;
};