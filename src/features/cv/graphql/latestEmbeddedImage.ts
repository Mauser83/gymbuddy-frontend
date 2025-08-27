import { gql } from '@apollo/client';

export const LATEST_EMBEDDED_IMAGE = gql`
  query LatestEmbeddedImage($input: LatestEmbeddedImageInput!) {
    getLatestEmbeddedImage(input: $input) {
      imageId
      createdAt
      scope
    }
  }
`;