import { gql } from '@apollo/client';

export const GYM_FRAGMENT = gql`
  fragment GymFragment on Gym {
    id
    name
    description
    city
    country
    address
    isApproved
    gymRoles {
      role
      user {
        id
        username
      }
    }
    equipment {
      id
    }
    trainers {
      id
    }
  }
`;
