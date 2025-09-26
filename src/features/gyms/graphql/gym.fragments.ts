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
    gymEquipment {
      id
      quantity
      note
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
      images {
        id
      }
    }
    trainers {
      id
    }
  }
`;
