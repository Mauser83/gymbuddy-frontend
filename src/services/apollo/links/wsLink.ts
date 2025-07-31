import {GraphQLWsLink} from '@apollo/client/link/subscriptions';
import {createClient} from 'graphql-ws';
import {refreshAccessToken, setWsClient} from '../tokenManager';
import {getAccessToken} from 'features/auth/utils/tokenStorage';
import {isTokenExpired} from 'features/auth/utils/isTokenExpired';
import {triggerLogout} from 'features/auth/utils/logoutTrigger'; // ✅ use this
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
          triggerLogout();
          Toast.show({
            type: 'error',
            text1: 'Session expired',
            text2: 'Please log in again.',
          });
        }
      }

      return {authorization: accessToken ? `Bearer ${accessToken}` : ''};
    },
  });

  setWsClient(client);

  return new GraphQLWsLink(client);
};
