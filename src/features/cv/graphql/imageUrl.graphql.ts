import {gql} from '@apollo/client';

export const IMAGE_URL = gql`
  query ImageUrl($storageKey: String!, $ttlSec: Int!) {
    imageUrl(storageKey: $storageKey, ttlSec: $ttlSec) {
      url
      expiresAt
    }
  }
`;