// apolloClient.ts
import {ApolloClient, InMemoryCache, from} from '@apollo/client';
import {authLink} from './links/authLink';
import {errorLink} from './links/errorLink';
import {createSplitLink} from './links/splitLink';
import {setApolloClient} from './tokenManager';
import Constants from 'expo-constants';

export const createApolloClient = async () => {
  const uri = Constants.expoConfig?.extra?.apiUrl;
  const splitLink = createSplitLink(uri);

  const client = new ApolloClient({
    link: from([errorLink, authLink, splitLink]),
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
