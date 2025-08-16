// gymEquipment.graphql.ts
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

export const UPLOAD_GYM_EQUIPMENT_IMAGE = gql`
  mutation UploadGymEquipmentImage($input: UploadGymEquipmentImageInput!) {
    uploadGymEquipmentImage(input: $input) {
      id
    }
  }
`;

export const DELETE_GYM_EQUIPMENT_IMAGE = gql`
  mutation DeleteGymEquipmentImage($imageId: Int!) {
    deleteGymEquipmentImage(imageId: $imageId)
  }
`;