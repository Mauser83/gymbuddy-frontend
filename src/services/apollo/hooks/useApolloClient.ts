import { ApolloClient } from '@apollo/client';
import { useMemo } from 'react';

import { useAuth } from 'features/auth/context/AuthContext';

import createApolloClient from '../apolloClient';

// Recreate the Apollo client when the access token changes to ensure links
// like WebSocket connections pick up the new credentials. The auth link itself
// reads the latest token for each request.
export const useApolloClient = (): ApolloClient<any> => {
  const { accessToken } = useAuth();

  return useMemo(() => {
    return createApolloClient();
  }, [accessToken]);
};
