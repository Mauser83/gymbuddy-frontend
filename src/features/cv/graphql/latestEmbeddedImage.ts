import {gql} from '@apollo/client';

export const LatestEmbeddedImageDocument = gql`
  query LatestEmbeddedImage($gymId: Int) {
    latestEmbeddedImage(gymId: $gymId) {
      imageId
      createdAt
    }
  }
`;