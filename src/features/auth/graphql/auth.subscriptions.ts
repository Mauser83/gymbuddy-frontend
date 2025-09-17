import { gql } from '@apollo/client';

export const USER_ROLE_UPDATED = gql`
  subscription {
    userRoleUpdated {
      id
      email
      username
      appRole
      userRole
    }
  }
`;
