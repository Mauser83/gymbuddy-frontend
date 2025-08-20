import {useLazyQuery, useMutation} from '@apollo/client';
import {
  CREATE_UPLOAD_SESSION,
  FINALIZE_GYM_IMAGES,
  IMAGE_URL_MANY,
  APPLY_TAXONOMIES,
} from '../graphql/uploadSession.graphql';

export function useCreateUploadSession(options?: any) {
  const [mutate, result] = useMutation(CREATE_UPLOAD_SESSION, options);
  return [mutate, result] as const;
}

export function useFinalizeGymImages(options?: any) {
  const [mutate, result] = useMutation(FINALIZE_GYM_IMAGES, options);
  return [mutate, result] as const;
}

export function useImageUrlMany(options?: any) {
  const [load, {data, loading, error}] = useLazyQuery(IMAGE_URL_MANY, {
    fetchPolicy: 'no-cache',
    ...options,
  });

  const refresh = (keys: string[], ttl?: number) =>
    load({variables: {keys, ttl}});

  const patchUrls = (tiles: any[], results: any[]) => {
    const map = new Map(results.map(r => [r.storageKey, r]));
    return tiles.map(t => {
      const found = map.get(t.storageKey);
      return found
        ? {...t, signedUrl: found.url, expiresAt: found.expiresAt}
        : t;
    });
  };

  return {refresh, patchUrls, data, loading, error};
}

export function useApplyTaxonomiesToGymImages(options?: any) {
  const [mutate, result] = useMutation(APPLY_TAXONOMIES, options);
  return [mutate, result] as const;
}