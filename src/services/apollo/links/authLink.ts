import {setContext} from '@apollo/client/link/context';

export const createAuthLink = (token: string | null) =>
  setContext((_, {headers}) => ({
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }));
