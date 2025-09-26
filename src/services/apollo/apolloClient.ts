// apolloClient.ts
import { ApolloClient, from } from '@apollo/client';

import { createCache } from './cache';
import { createAuthLink } from './links/authLink';
import { errorLink } from './links/errorLink';
import { createSplitLink } from './links/splitLink';
import { setApolloClient } from './tokenManager';
import { API_BASE_URL, STAGE } from '../../config/env';

export const createApolloClient = () => {
  const GRAPHQL_URL = `${API_BASE_URL.replace(/\/$/, '')}/graphql`; // always append once

  console.log(`Apollo pointing to: ${GRAPHQL_URL} (${STAGE})`);

  const splitLink = createSplitLink(GRAPHQL_URL);

  const client = new ApolloClient({
    link: from([errorLink, createAuthLink(), splitLink]),
    cache: createCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: 'cache-and-network', errorPolicy: 'all' },
      query: { fetchPolicy: 'cache-first', errorPolicy: 'all' },
      mutate: { errorPolicy: 'all' },
    },
  });

  setApolloClient(client);
  return client;
};

export default createApolloClient;
