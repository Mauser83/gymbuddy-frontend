// tokenManager.ts
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
} from '../../modules/auth/utils/tokenStorage';
import {ApolloClient} from '@apollo/client';
import {REFRESH_TOKEN_MUTATION} from 'modules/auth/graphql/auth.mutations';
import {triggerLogout} from 'modules/auth/utils/logoutTrigger'; // ✅ use this
import Toast from 'react-native-toast-message';
import {rawClient} from './rawClient';
import {createClient, Client} from 'graphql-ws';

// 👇 Make sure this matches your WS server
const WS_URL = 'ws://192.168.68.104:4000/graphql';

let apolloClient: ApolloClient<any> | null = null;
let refreshingPromise: Promise<string | null> | null = null;
let wsClient: Client | null = null;

export const setApolloClient = (client: ApolloClient<any>) => {
  apolloClient = client;
};

export const setWsClient = (client: Client) => {
  wsClient = client;
};

export const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshingPromise) {
    return refreshingPromise;
  }

  refreshingPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken || !apolloClient) {
        console.warn('Missing refreshToken or apolloClient');
        return null;
      }

      const {data} = await rawClient.mutate({
        mutation: REFRESH_TOKEN_MUTATION,
        variables: {input: {refreshToken}},
        context: {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        },
      });

      const {accessToken, refreshToken: newRefresh} = data?.refreshToken || {};
      if (!accessToken || !newRefresh) {
        console.warn('No tokens returned');
        return null;
      }

      await setAccessToken(accessToken);
      await setRefreshToken(newRefresh);

      // 👇 Reconnect WebSocket with new token
      if (wsClient) {
        wsClient.dispose(); // disconnect old socket

        wsClient = createClient({
          url: WS_URL,
          connectionParams: async () => {
            const freshToken = await getAccessToken();
            return {
              authorization: `Bearer ${freshToken}`,
            };
          },
        });
      }

      return accessToken;
    } catch (error: any) {
      console.error('Refresh token error:', error?.message || error);
      console.error('Full error object:', error);
      triggerLogout();
      Toast.show({
        type: 'error',
        text1: 'Session expired',
        text2: 'Please log in again.',
      });
      return null;
    } finally {
      refreshingPromise = null;
    }
  })();

  return refreshingPromise;
};
