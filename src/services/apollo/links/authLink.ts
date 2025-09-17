import { setContext } from '@apollo/client/link/context';

import { getAccessToken } from 'src/features/auth/utils/tokenStorage';

// Always read the latest access token from storage so that refreshed tokens
// are used for subsequent requests without recreating the Apollo client.
export const createAuthLink = () =>
  setContext(async (_, { headers }) => {
    const token = await getAccessToken();
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    };
  });
