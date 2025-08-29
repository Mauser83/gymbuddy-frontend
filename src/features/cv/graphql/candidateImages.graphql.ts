import {gql} from '@apollo/client';

export const CANDIDATE_GLOBAL_IMAGES = gql`
  query CandidateGlobalImages($input: CandidateGlobalImagesInput!) {
    candidateGlobalImages(input: $input) {
      id
      gymId
      gymName
      equipmentId
      storageKey
      sha256
      status
      approvedAt
      approvedBy {
        id
        username
        __typename
      }
      createdAt
      tags {
        angleId
        heightId
        distanceId
        lightingId
        mirrorId
        splitId
        sourceId
      }
      safety {
        state
        score
        reasons
      }
      dupCount
      __typename
    }
  }
`;

export const APPROVE_GYM_IMAGE = gql`
  mutation ApproveGymImage($input: ApproveGymImageInput!) {
    approveGymImage(input: $input) {
      gymImage {
        id
        status
        approvedAt
        approvedBy {
          id
          username
          __typename
        }
        __typename
      }
      __typename
    }
  }
`;

export const REJECT_GYM_IMAGE = gql`
  mutation RejectGymImage($input: RejectGymImageInput!) {
    rejectGymImage(input: $input) {
      gymImage {
        id
        status
        __typename
      }
      __typename
    }
  }
`;

export const PROMOTE_GYM_IMAGE_TO_GLOBAL = gql`
  mutation PromoteGymImageToGlobal($input: PromoteGymImageInput!) {
    promoteGymImageToGlobal(input: $input) {
      gymImage {
        id
        status
        __typename
      }
      equipmentImage {
        id
        __typename
      }
      destinationKey
      __typename
    }
  }
`;
