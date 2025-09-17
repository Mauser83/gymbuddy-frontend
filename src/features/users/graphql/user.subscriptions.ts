// features/users/graphql/subscriptions/userUpdated.subscription.ts
import { gql } from '@apollo/client';

import { USER_FRAGMENT } from './user.fragments';

export const USER_UPDATED_SUBSCRIPTION = gql`
  subscription OnUserUpdated {
    userUpdated {
      ...UserFragment
    }
  }
  ${USER_FRAGMENT}
`;
