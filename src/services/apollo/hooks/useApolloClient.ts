import {useState, useEffect} from 'react';
import createApolloClient from '../apolloClient';
import {useAuth} from 'features/auth/context/AuthContext';
import { ApolloClient } from '@apollo/client';

// useApolloClient.ts
export const useApolloClient = () => {
    const [client, setClient] = useState<ApolloClient<any> | null>(null);
    const {sessionLoaded} = useAuth();
  
    useEffect(() => {
      if (sessionLoaded && !client) {
        createApolloClient().then(setClient);
      }
    }, [sessionLoaded]);
  
    return client;
  };