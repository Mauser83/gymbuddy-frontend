import {gql} from '@apollo/client';

export const CREATE_RECOGNITION_UPLOAD_TICKET = gql`
  mutation CreateRecognitionUploadTicket($gymId: Int!, $ext: String!) {
    createRecognitionUploadTicket(gymId: $gymId, ext: $ext) {
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
    }
  }
`;

export const CONFIRM_RECOGNITION = gql`
  mutation ConfirmRecognition($input: ConfirmRecognitionInput!) {
    confirmRecognition(input: $input) {
      saved
      promotedStorageKey
    }
  }
`;

export const DISCARD_RECOGNITION = gql`
  mutation DiscardRecognition($attemptId: ID!) {
    discardRecognition(attemptId: $attemptId)
  }
`;