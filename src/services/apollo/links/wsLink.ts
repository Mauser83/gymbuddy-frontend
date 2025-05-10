// links/wsLink.ts
import {GraphQLWsLink} from '@apollo/client/link/subscriptions';
import {createClient} from 'graphql-ws';
import {getAccessToken, refreshAccessToken} from '../tokenManager';
import {isTokenExpired} from 'modules/auth/utils/isTokenExpired';
import {logoutFromContext} from 'modules/auth/context/AuthContext';
import Toast from 'react-native-toast-message';

export const createWsLink = (url: string) => {
  return new GraphQLWsLink(
    createClient({
      url,
      connectionParams: async () => {
        let accessToken = await getAccessToken();

        if (!accessToken || isTokenExpired(accessToken)) {
          try {
            accessToken = await refreshAccessToken();
          } catch {
            await logoutFromContext();
            Toast.show({type: 'error', text1: 'Session expired', text2: 'Please log in again.'});
          }
        }

        return {authorization: accessToken ? `Bearer ${accessToken}` : ''};
      },
    })
  );
};
