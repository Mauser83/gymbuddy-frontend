import {gql} from '@apollo/client';

export const KnnSearchDocument = gql`
  query Knn($input: KnnSearchInput!) {
    knnSearch(input: $input) {
      imageId
      equipmentId
      score
      storageKey
    }
  }
`;