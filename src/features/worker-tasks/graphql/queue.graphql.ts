+18
-28

import {gql} from '@apollo/client';

export const IMAGE_JOBS = gql`
  query ImageJobs(
    $status: ImageJobStatus
    $limit: Int
  ) {
    imageJobs(
      status: $status
      limit: $limit
    ) {
      id
      imageId
      storageKey
      jobType
      status
      attempts
      priority
      scheduledAt
      startedAt
      finishedAt
      lastError
      updatedAt
    }
  }
`;

export const IMAGE_URL_MANY = gql`
  query ImageUrlMany($keys: [String!]!, $ttl: Int = 300) {
    imageUrlMany(storageKeys: $keys, ttl: $ttl) {
      storageKey
      url
      expiresAt
    }
  }
`;

export const RETRY_IMAGE_JOB = gql`
  mutation RetryImageJob($id: ID!) {
    retryImageJob(id: $id) {
      id
      status
      attempts
      updatedAt
    }
  }
`;

export const RETRY_IMAGE_JOBS_BY_IMAGE = gql`
  mutation RetryImageJobsByImage($imageId: ID!) {
    retryImageJobs(imageId: $imageId) {
      count
    }
  }
`;

export const RETRY_IMAGE_JOBS_BY_STORAGE_KEY = gql`
  mutation RetryImageJobsByStorageKey($storageKey: String!) {
    retryImageJobsByStorageKey(storageKey: $storageKey) {
      count
    }
  }
`;