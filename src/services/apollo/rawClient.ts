import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

export const rawClient = new ApolloClient({
  link: new HttpLink({
    uri: 'http://192.168.68.104:4000/graphql',
  }),
  cache: new InMemoryCache(),
});
