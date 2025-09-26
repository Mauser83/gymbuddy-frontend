import { ApolloClient, HttpLink } from '@apollo/client';

import { createCache } from './cache';
import { API_BASE_URL } from '../../config/env'; // add if not present
const GRAPHQL_URL = `${API_BASE_URL.replace(/\/$/, '')}/graphql`; // <-- append once

export const rawClient = new ApolloClient({
  link: new HttpLink({
    uri: GRAPHQL_URL,
  }),
  cache: createCache(),
});
