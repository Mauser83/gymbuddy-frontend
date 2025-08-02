import {useMemo} from 'react';
import {ApolloClient} from '@apollo/client';
import {useAuth} from 'features/auth/context/AuthContext';
import createApolloClient from '../apolloClient';

export const useApolloClient = (): ApolloClient<any> => {
  const {accessToken} = useAuth();

  return useMemo(() => createApolloClient(accessToken), [accessToken]);
};