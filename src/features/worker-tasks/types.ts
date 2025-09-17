export type ImageJobStatus = 'pending' | 'processing' | 'succeeded' | 'failed';

export type ImageJobType = 'hash' | 'safety' | 'embed';

export interface ImageQueueItem {
  id: string;
  imageId?: string | null;
  storageKey?: string | null;
  jobType: string;
  status: ImageJobStatus;
  attempts: number;
  priority?: number | null;
  scheduledAt?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  lastError?: string | null;
  updatedAt?: string | null;
}

export interface ImageJobGroup {
  key: string; // imageId or "sk:<storageKey>" or fallback
  imageId?: string | null;
  storageKey?: string | null;
  jobs: Partial<Record<ImageJobType, ImageQueueItem>>;
}
