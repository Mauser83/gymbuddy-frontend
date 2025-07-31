import { gql } from '@apollo/client';

export const APPROVE_GYM = gql`
  mutation ApproveGym($gymId: Int!) {
    approveGym(gymId: $gymId)
  }
`;

export const CREATE_GYM_MUTATION = gql`
  mutation CreateGym($input: CreateGymInput!) {
    createGym(input: $input) {
      id
      name
      city
      country
      isApproved
    }
  }
`;
