// tokenManager.ts
import {storage} from 'modules/auth/utils/storage';
import {ApolloClient} from '@apollo/client';
import {REFRESH_TOKEN_MUTATION} from 'modules/auth/graphql/auth.mutations';
import {logoutFromContext} from 'modules/auth/context/AuthContext';
import Toast from 'react-native-toast-message';

let apolloClient: ApolloClient<any> | null = null;
let refreshingPromise: Promise<string | null> | null = null;

export const setApolloClient = (client: ApolloClient<any>) => {
  apolloClient = client;
};

export const getAccessToken = async () => {
  return storage.getItem('accessToken');
};

export const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshingPromise) return refreshingPromise;

  refreshingPromise = (async () => {
    const refreshToken = await storage.getItem('refreshToken');
    if (!refreshToken || !apolloClient) {
      refreshingPromise = null;
      return null;
    }

    try {
      const {data} = await apolloClient.mutate({
        mutation: REFRESH_TOKEN_MUTATION,
        variables: {input: {refreshToken}},
      });

      const {accessToken, refreshToken: newRefresh} = data.refreshToken;
      await storage.setItem('accessToken', accessToken);
      await storage.setItem('refreshToken', newRefresh);
      return accessToken;
    } catch (error) {
      await logoutFromContext();
      Toast.show({type: 'error', text1: 'Session expired', text2: 'Please log in again.'});
      return null;
    } finally {
      refreshingPromise = null;
    }
  })();

  return refreshingPromise;
};
