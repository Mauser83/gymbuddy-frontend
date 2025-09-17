// links/splitLink.ts
import { HttpLink, split } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';

import { createWsLink } from './wsLink';

export const createSplitLink = (uri: string) => {
  const httpLink = new HttpLink({ uri, credentials: 'include' });
  const wsLink = createWsLink(uri.replace(/^https/, 'wss'));

  return split(
    ({ query }) => {
      const def = getMainDefinition(query);
      return def.kind === 'OperationDefinition' && def.operation === 'subscription';
    },
    wsLink,
    httpLink,
  );
};
