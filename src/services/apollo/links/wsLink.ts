import {GraphQLWsLink} from '@apollo/client/link/subscriptions';
import {createClient} from 'graphql-ws';
import {setWsClient} from '../tokenManager';

export const createWsLink = (token: string | null, url: string) => {
  const client = createClient({
    url,
    connectionParams: async () => {
      const params = {Authorization: token ? `Bearer ${token}` : ''};
      console.log('WS connection params:', params);
      return params;
    },
  });

  setWsClient(client);

  return new GraphQLWsLink(client);
};