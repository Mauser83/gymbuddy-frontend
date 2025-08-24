import {gql} from '@apollo/client';

export const IMAGE_JOBS = gql`
  query ImageJobs($status: ImageJobStatus, $limit: Int) {
    imageJobs(status: $status, limit: $limit) {
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
  query ImageUrlMany($keys: [String!]!) {
    imageUrlMany(storageKeys: $keys) {
      storageKey
      url
      expiresAt
    }
  }
`;

export const RUN_IMAGE_WORKER_ONCE = gql`
  mutation RunImageWorkerOnce($max: Int = 150) {
    runImageWorkerOnce(max: $max) {
      ok
      status
    }
  }
`;