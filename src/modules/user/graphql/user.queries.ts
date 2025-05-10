import { gql } from '@apollo/client';

export const GET_USERS = gql`
  query GetUsers($search: String) {
    users(search: $search) {
      id
      email
      username
    }
  }
`;

export const GET_USER_BY_ID = gql`
  query GetUserById($id: ID!) {
    userById(id: $id) {
      id
      email
      username
      appRole
      userRole
      createdAt
      gymManagementRoles {
        role
        gym {
          id
          name
        }
      }
    }
  }
`;
