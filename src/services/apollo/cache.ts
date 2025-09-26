import { InMemoryCache, InMemoryCacheConfig } from '@apollo/client';

const cacheConfig: InMemoryCacheConfig = {
  typePolicies: {
    Gym: { keyFields: ['id'] },
    User: { keyFields: ['id'] },
  },
};

export const createCache = () => new InMemoryCache(cacheConfig);

export type AppCache = ReturnType<typeof createCache>;
