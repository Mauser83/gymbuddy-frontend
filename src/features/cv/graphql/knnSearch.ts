import { gql } from '@apollo/client';

export const KNN_SEARCH = gql`
  query Knn($input: KnnSearchInput!) {
    knnSearch(input: $input) {
      imageId
      equipmentId
      score
      storageKey
    }
  }
`;
