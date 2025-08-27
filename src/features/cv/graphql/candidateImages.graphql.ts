import {gql} from '@apollo/client';

export const CANDIDATE_GLOBAL_IMAGES = gql`
  query CandidateGlobalImages(
    $equipmentId: ID!
    $limit: Int
    $gymId: ID
    $status: CandidateStatus
    $safety: SafetyStatus
    $search: String
  ) {
    candidateGlobalImages(
      equipmentId: $equipmentId
      limit: $limit
      gymId: $gymId
      status: $status
      safety: $safety
      search: $search
    ) {
      id
      gymId
      gymName
      equipmentId
      storageKey
      sha256
      createdAt
      safety {
        state
        score
        reasons
      }
      status
      tags {
        angleId
        splitId
        sourceId
      }
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