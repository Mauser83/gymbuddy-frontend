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
      safety { state score reasons }
      dupCount
      __typename
    }
  }
`;

export const APPROVE_GYM_IMAGE = gql`
  mutation ApproveGymImage($id: ID!, $splitId: ID) {
    approveGymImage(id: $id, splitId: $splitId) {
      equipmentImage {
        id
        equipmentId
        storageKey
      }
      gymImage {
        id
        status
      }
    }
  }
`;

export const REJECT_GYM_IMAGE = gql`
  mutation RejectGymImage($id: ID!, $reason: String) {
    rejectGymImage(id: $id, reason: $reason) {
      gymImage {
        id
        status
        rejectionReason
      }
    }
  }
`;

export const PROMOTE_GYM_IMAGE_TO_GLOBAL = gql`
  mutation PromoteGymImageToGlobal($id: ID!, $splitId: ID, $force: Boolean) {
    promoteGymImageToGlobal(id: $id, splitId: $splitId, force: $force) {
      equipmentImage {
        id
      }
      gymImage {
        id
        promotedAt
      }
    }
  }
`;