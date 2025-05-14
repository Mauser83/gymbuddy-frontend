// wsLink.ts
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getAccessToken, refreshAccessToken, setWsClient } from '../tokenManager';
import { isTokenExpired } from 'modules/auth/utils/isTokenExpired';
import { logoutFromContext } from 'modules/auth/context/AuthContext';
import Toast from 'react-native-toast-message';

export const createWsLink = (url: string) => {
  const client = createClient({
    url,
    connectionParams: async () => {
      let accessToken = await getAccessToken();

      if (!accessToken || isTokenExpired(accessToken)) {
        try {
          accessToken = await refreshAccessToken();
        } catch {
          await logoutFromContext();
          Toast.show({ type: 'error', text1: 'Session expired', text2: 'Please log in again.' });
        }
      }

      return { authorization: accessToken ? `Bearer ${accessToken}` : '' };
    },
  });

  setWsClient(client); // 👈 Save reference for refresh logic

  return new GraphQLWsLink(client);
};
