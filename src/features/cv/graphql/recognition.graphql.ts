import { gql } from '@apollo/client';

export const CREATE_RECOGNITION_UPLOAD_TICKET = gql`
  mutation CreateRecognitionUploadTicket(
    $gymId: Int!
    $ext: String!
    $contentType: String
    $contentLength: Int
  ) {
    createRecognitionUploadTicket(
      gymId: $gymId
      input: { ext: $ext, contentType: $contentType, contentLength: $contentLength }
    ) {
      ticketToken
      putUrl
      storageKey
      expiresAt
    }
  }
`;

export const RECOGNIZE_IMAGE = gql`
  mutation RecognizeImage($ticketToken: String!, $limit: Int) {
    recognizeImage(ticketToken: $ticketToken, limit: $limit) {
      attempt {
        attemptId
        storageKey
        vectorHash
        bestEquipmentId
        bestScore
        createdAt
        decision
      }

      # (legacy; keep for backwards-compat or fallback)
      globalCandidates {
        equipmentId
        imageId
        score
        storageKey
      }
      gymCandidates {
        equipmentId
        imageId
        score
        storageKey
      }

      # NEW equipment-level aggregation from backend
      equipmentCandidates {
        equipmentId
        equipmentName
        topScore
        representative {
          imageId
          equipmentId
          storageKey
          score
        }
        source
        totalImagesConsidered
        # images { imageId equipmentId storageKey score }  # optional if you want previews
      }
    }
  }
`;

export const CONFIRM_RECOGNITION = gql`
  mutation ConfirmRecognition($input: ConfirmRecognitionInput!) {
    confirmRecognition(input: $input) {
      saved
    }
  }
`;

export const DISCARD_RECOGNITION = gql`
  mutation DiscardRecognition($attemptId: ID!) {
    discardRecognition(attemptId: $attemptId)
  }
`;
