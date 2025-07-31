import {gql} from '@apollo/client';
import {GYM_FRAGMENT} from './gym.fragments';

export const GYM_APPROVED_SUBSCRIPTION = gql`
  subscription OnGymApproved {
    gymApproved {
      ...GymFragment
    }
  }
  ${GYM_FRAGMENT}
`;

export const GYM_CREATED_SUBSCRIPTION = gql`
  subscription OnGymCreated {
    gymCreated {
      ...GymFragment
    }
  }
  ${GYM_FRAGMENT}
`;
