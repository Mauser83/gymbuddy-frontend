import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import Constants from 'expo-constants';

export const rawClient = new ApolloClient({
  link: new HttpLink({
    uri: Constants.expoConfig?.extra?.apiUrl,
  }),
  cache: new InMemoryCache(),
});
