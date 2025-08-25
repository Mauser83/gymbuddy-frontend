import {useLazyQuery} from '@apollo/client';
import {LatestEmbeddedImageDocument} from '../graphql/latestEmbeddedImage';

export function useLatestEmbeddedImage() {
  const [run, {data, loading, error}] = useLazyQuery(
    LatestEmbeddedImageDocument,
    {fetchPolicy: 'network-only'},
  );

  return {
    fetchLatest: (gymId?: number) => run({variables: {gymId}}),
    latest: data?.latestEmbeddedImage ?? null,
    loading,
    error,
  };
}