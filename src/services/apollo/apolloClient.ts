// apolloClient.ts
import {ApolloClient, InMemoryCache, from} from '@apollo/client';
import {createAuthLink} from './links/authLink';
import {errorLink} from './links/errorLink';
import {createSplitLink} from './links/splitLink';
import {setApolloClient} from './tokenManager';
import {API_BASE_URL, stage} from '../../config/env';

export const createApolloClient = () => {
  const GRAPHQL_URL = `${API_BASE_URL.replace(/\/$/, '')}/graphql`; // always append once

  console.log(`Apollo pointing to: ${GRAPHQL_URL} (${stage})`);

  const splitLink = createSplitLink(GRAPHQL_URL);

  const client = new ApolloClient({
    link: from([errorLink, createAuthLink(), splitLink]),
    cache: new InMemoryCache({
      typePolicies: {
        Gym: {keyFields: ['id']},
        User: {keyFields: ['id']},
        TaxonomyType: {
          keyFields: ['kind', 'id'],
        },
        Query: {
          fields: {
            taxonomyTypes: {
              keyArgs: ['kind', 'active'],
              merge(_existing, incoming) {
                return incoming;
              },
            },
          },
        },
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
