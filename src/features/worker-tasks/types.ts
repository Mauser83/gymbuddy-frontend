export type ImageJobStatus = 'pending' | 'running' | 'done' | 'failed';
export type ImageJobType = 'hash' | 'safety' | 'embed';

export interface ImageQueueItem {
  id: string;
  imageId?: string | null;
  storageKey?: string | null;
  jobType: ImageJobType;
  status: ImageJobStatus;
  attempts: number;
  priority?: number | null;
  scheduledAt?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  lastError?: string | null;
  updatedAt?: string | null;
}

export interface ImageQueueResponse {
  items: ImageQueueItem[];
  total: number;
  hasMore: boolean;
}