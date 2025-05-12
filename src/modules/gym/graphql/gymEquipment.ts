// gymEquipment.graphql.ts
import { gql } from '@apollo/client';

export const GET_GYM_EQUIPMENT = gql`
  query GetGymEquipment($gymId: Int!) {
    gymEquipment(gymId: $gymId) {
      id
      name
      brand
      category {
        id
        name
      }
    }
  }
`;

export const ASSIGN_EQUIPMENT_TO_GYM = gql`
  mutation AssignEquipmentToGym($gymId: Int!, $equipmentId: Int!) {
    assignEquipmentToGym(gymId: $gymId, equipmentId: $equipmentId) {
      id
    }
  }
`;

export const REMOVE_EQUIPMENT_FROM_GYM = gql`
  mutation RemoveEquipmentFromGym($gymId: Int!, $equipmentId: Int!) {
    removeEquipmentFromGym(gymId: $gymId, equipmentId: $equipmentId)
  }
`;

export const GET_GYM_EQUIPMENT_STATS = gql`
  query GetGymEquipmentStats($gymId: Int!) {
    gymEquipmentStats(gymId: $gymId) {
      total
      lastUpdated
      byCategory {
        name
        count
      }
    }
  }
`;
