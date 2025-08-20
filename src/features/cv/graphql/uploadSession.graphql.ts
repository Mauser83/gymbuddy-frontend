import {gql} from '@apollo/client';

export const CREATE_UPLOAD_SESSION = gql`
  mutation CreateUploadSession($input: CreateUploadSessionInput!) {
    createUploadSession(input: $input) {
      sessionId
      expiresAt
      items {
        url
        storageKey
        expiresAt
        requiredHeaders { key value }
      }
    }
  }
`;

export const FINALIZE_GYM_IMAGES = gql`
  mutation FinalizeGymImages($input: FinalizeGymImagesInput!) {
    finalizeGymImages(input: $input) {
      images { id imageId storageKey }
      queuedJobs { id jobType status }
    }
  }
`;

export const IMAGE_URL_MANY = gql`
  query ImageUrlMany($keys: [String!]!, $ttl: Int) {
    imageUrlMany(storageKeys: $keys, ttlSec: $ttl) {
      storageKey
      url
      expiresAt
    }
  }
`;

export const APPLY_TAXONOMIES = gql`
  mutation ApplyTaxonomiesToGymImages($input: ApplyTaxonomiesToGymImagesInput!) {
    applyTaxonomiesToGymImages(input: $input) {
      updatedCount
    }
  }
`;