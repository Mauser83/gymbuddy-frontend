import { gql } from '@apollo/client';

export const UPDATE_USER_ROLES = gql`
  mutation UpdateUserRoles($userId: ID!, $input: UpdateUserRolesInput!) {
    updateUserRoles(userId: $userId, input: $input) {
      id
      email
      username
      appRole
      userRole
    }
  }
`;