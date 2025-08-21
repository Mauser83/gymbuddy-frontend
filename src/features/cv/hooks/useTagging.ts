import { gql, useMutation, useQuery } from '@apollo/client';

export const ANGLES = gql`
  query Angles {
    taxonomyTypes(kind: ANGLE, active: true) {
      id
      label
    }
  }
`;

export const APPLY_TAGS = gql`
  mutation Apply($imageIds: [Int!]!, $angleId: Int) {
    applyTaxonomiesToGymImages(input: { imageIds: $imageIds, angleId: $angleId }) {
      updatedCount
    }
  }
`;

export function useAngles() {
  return useQuery(ANGLES);
}

export function useApplyTags() {
  return useMutation(APPLY_TAGS);
}