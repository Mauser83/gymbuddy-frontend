// links/authLink.ts
import {setContext} from '@apollo/client/link/context';
import {getAccessToken, refreshAccessToken} from '../tokenManager';
import {storage} from 'modules/auth/utils/storage';
import {isTokenExpired} from 'modules/auth/utils/isTokenExpired';
import {logoutFromContext} from 'modules/auth/context/AuthContext';

export const authLink = setContext(async (_, {headers}) => {
  let token = await getAccessToken();
  const refreshToken = await storage.getItem('refreshToken');

  if ((!token || isTokenExpired(token)) && refreshToken) {
    token = await refreshAccessToken();
  }

  if (!token) {
    await logoutFromContext();
    return {headers};
  }

  return {
    headers: {
      ...headers,
      authorization: `Bearer ${token}`,
    },
  };
});
