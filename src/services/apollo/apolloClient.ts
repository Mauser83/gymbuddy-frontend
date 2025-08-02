// apolloClient.ts
import {ApolloClient, InMemoryCache, from} from '@apollo/client';
import {createAuthLink} from './links/authLink';
import {errorLink} from './links/errorLink';
import {createSplitLink} from './links/splitLink';
import {setApolloClient} from './tokenManager';
import Constants from 'expo-constants';

export const createApolloClient = (token: string | null) => {
  const uri = Constants.expoConfig?.extra?.apiUrl as string;
  const splitLink = createSplitLink(token, uri);

  const client = new ApolloClient({
    link: from([errorLink, createAuthLink(token), splitLink]),
    cache: new InMemoryCache({
      typePolicies: {
        Gym: {keyFields: ['id']},
        User: {keyFields: ['id']},
      },
    }),
    defaultOptions: {
      watchQuery: {fetchPolicy: 'cache-and-network', errorPolicy: 'all'},
      query: {fetchPolicy: 'cache-first', errorPolicy: 'all'},
      mutate: {errorPolicy: 'all'},
    },
  });

  setApolloClient(client);
  return client;
};

export default createApolloClient;