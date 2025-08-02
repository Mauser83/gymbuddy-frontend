import {GraphQLWsLink} from '@apollo/client/link/subscriptions';
import {createClient} from 'graphql-ws';
import {setWsClient} from '../tokenManager';

export const createWsLink = (token: string | null, url: string) => {
  const client = createClient({
    url,
    connectionParams: async () => ({
      Authorization: token ? `Bearer ${token}` : '',
    }),
  });

  setWsClient(client);

  return new GraphQLWsLink(client);
};