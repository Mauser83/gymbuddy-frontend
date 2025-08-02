import {useMemo} from 'react';
import {ApolloClient} from '@apollo/client';
import {useAuth} from 'features/auth/context/AuthContext';
import {getAccessToken} from 'features/auth/utils/tokenStorage';
import createApolloClient from '../apolloClient';

export const useApolloClient = (): ApolloClient<any> => {
  const {accessToken} = useAuth();

  return useMemo(() => {
    console.log('Token for Apollo:', accessToken);
    getAccessToken().then(storedToken =>
      console.log('Token from storage before client creation:', storedToken),
    );
    return createApolloClient(accessToken);
  }, [accessToken]);
};
