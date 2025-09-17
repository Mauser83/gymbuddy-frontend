import { gql } from '@apollo/client';

export type TrainingCandidateStatus = 'PENDING' | 'QUARANTINED' | 'APPROVED' | 'REJECTED';

export interface ListTrainingCandidatesInput {
  gymId: number;
  status?: TrainingCandidateStatus;
  equipmentId?: number;
  q?: string;
  cursor?: string;
  limit?: number;
}

export interface TrainingCandidateRow {
  id: string;
  gymId: number;
  gymEquipmentId: number;
  equipmentId: number;
  equipmentName?: string;
  storageKey: string;
  url: string;
  status: TrainingCandidateStatus;
  safetyReasons?: string[];
  capturedAt?: string;
  uploader?: { id: string; username?: string };
  hash?: string;
  processedAt?: string;
}

export interface TrainingCandidateConnection {
  items: TrainingCandidateRow[];
  nextCursor?: string | null;
}

export const LIST_TRAINING_CANDIDATES = gql`
  query ListTrainingCandidates($input: ListTrainingCandidatesInput!) {
    listTrainingCandidates(input: $input) {
      items {
        id
        gymId
        gymEquipmentId
        equipmentId
        equipmentName
        storageKey
        url
        status
        safetyReasons
        capturedAt
        uploader {
          id
          username
          __typename
        }
        hash
        processedAt
        __typename
      }
      nextCursor
      __typename
    }
  }
`;

export const APPROVE_TRAINING_CANDIDATE = gql`
  mutation ApproveTrainingCandidate($input: ApproveTrainingCandidateInput!) {
    approveTrainingCandidate(input: $input) {
      approved
      imageId
      storageKey
      __typename
    }
  }
`;

export const REJECT_TRAINING_CANDIDATE = gql`
  mutation RejectTrainingCandidate($input: RejectTrainingCandidateInput!) {
    rejectTrainingCandidate(input: $input) {
      rejected
      __typename
    }
  }
`;
