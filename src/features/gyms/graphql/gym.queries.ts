// features/gyms/graphql/queries/gyms.query.ts
import { gql } from '@apollo/client';
import { GYM_FRAGMENT } from './gym.fragments';

export const GET_GYMS = gql`
  query GetGyms($search: String) {
    gyms(search: $search) {
      id
      name
      city
      country
    }
  }
`;

export const GET_GYM_BY_ID = gql`
  query GetGymById($id: Int!) {
    gymById(id: $id) {
      ...GymFragment
    }
  }
  ${GYM_FRAGMENT}
`;

export const GET_PENDING_GYMS = gql`
  query GetPendingGyms {
    pendingGyms {
      ...GymFragment
    }
  }
  ${GYM_FRAGMENT}
`;
