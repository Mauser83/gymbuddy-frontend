import { setContext } from '@apollo/client/link/context';
import {
  getAccessToken,
  getRefreshToken,
} from 'features/auth/utils/tokenStorage';
import { isTokenExpired } from 'features/auth/utils/isTokenExpired';
import { refreshAccessToken } from '../tokenManager'; // or wherever it's defined

export const authLink = setContext(async (_, { headers }) => {
  let token = await getAccessToken();
  const refreshToken = await getRefreshToken();

  if ((!token || isTokenExpired(token)) && refreshToken) {
    token = await refreshAccessToken();
  }

  if (!token) {
    return { headers }; // no auth
  }

  return {
    headers: {
      ...headers,
      authorization: `Bearer ${token}`,
    },
  };
});
