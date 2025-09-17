import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

import { getAccessToken } from 'src/features/auth/utils/tokenStorage';

import { setWsClient } from '../tokenManager';

export const createWsLink = (url: string) => {
  // console.log('Attempting WS Link:', url);
  const client = createClient({
    url,
    connectionParams: async () => {
      const token = await getAccessToken();
      const params = { Authorization: token ? `Bearer ${token}` : '' };
      // console.log('WS connection params:', params);
      return params;
    },
  });

  setWsClient(client);

  return new GraphQLWsLink(client);
};
