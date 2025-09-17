import { gql } from '@apollo/client';

export const GET_GYM_EQUIPMENT = gql`
  query GetGymEquipment($gymId: Int!) {
    getGymEquipment(gymId: $gymId) {
      id
      quantity
      note
      images {
        id
      }
      equipment {
        id
        name
        brand
        category {
          id
          name
        }
        subcategory {
          id
          name
        }
        images {
          id
        }
      }
    }
  }
`;

export const GET_GYM_EQUIPMENT_DETAIL = gql`
  query GetGymEquipmentDetail($gymEquipmentId: Int!) {
    getGymEquipmentDetail(gymEquipmentId: $gymEquipmentId) {
      id
      quantity
      note
      createdAt
      updatedAt
      images {
        id
      }
      gym {
        id
        name
      }
      equipment {
        id
        name
        brand
        category {
          id
          name
        }
        subcategory {
          id
          name
        }
        images {
          id
        }
      }
    }
  }
`;

export const ASSIGN_EQUIPMENT_TO_GYM = gql`
  mutation AssignEquipmentToGym($input: AssignEquipmentToGymInput!) {
    assignEquipmentToGym(input: $input) {
      id
      quantity
      note
      equipment {
        id
        name
        brand
      }
    }
  }
`;

export const UPDATE_GYM_EQUIPMENT = gql`
  mutation UpdateGymEquipment($input: UpdateGymEquipmentInput!) {
    updateGymEquipment(input: $input) {
      id
      quantity
      note
    }
  }
`;

export const REMOVE_GYM_EQUIPMENT = gql`
  mutation RemoveGymEquipment($gymEquipmentId: Int!) {
    removeGymEquipment(gymEquipmentId: $gymEquipmentId)
  }
`;

export const LIST_GYM_EQUIPMENT_IMAGES = gql`
  query ListGymEquipmentImages($gymEquipmentId: Int!, $limit: Int, $cursor: String) {
    listGymEquipmentImages(gymEquipmentId: $gymEquipmentId, limit: $limit, cursor: $cursor) {
      items {
        id
        url
        isPrimary
        status
        capturedAt
      }
      nextCursor
    }
  }
`;

export const CREATE_EQUIPMENT_TRAINING_UPLOAD_TICKET = gql`
  mutation CreateEquipmentTrainingUploadTicket(
    $gymId: Int!
    $equipmentId: Int!
    $ext: String!
    $contentType: String
    $contentLength: Int
  ) {
    createEquipmentTrainingUploadTicket(
      gymId: $gymId
      equipmentId: $equipmentId
      input: { ext: $ext, contentType: $contentType, contentLength: $contentLength }
    ) {
      putUrl
      storageKey
      __typename
    }
  }
`;

export const FINALIZE_EQUIPMENT_TRAINING_IMAGE = gql`
  mutation FinalizeEquipmentTrainingImage($gymEquipmentId: Int!, $storageKey: String!) {
    finalizeEquipmentTrainingImage(gymEquipmentId: $gymEquipmentId, storageKey: $storageKey) {
      id
      url
      isPrimary
      createdAt
    }
  }
`;

export const DELETE_GYM_EQUIPMENT_IMAGE = gql`
  mutation DeleteGymEquipmentImage($imageId: ID!) {
    deleteGymEquipmentImage(imageId: $imageId)
  }
`;
