import {gql, useMutation, useQuery} from '@apollo/client';

// Generic taxonomy options query
const TAXONOMY_OPTIONS = gql`
  query TaxonomyOptions($kind: TaxonomyKind!, $active: Boolean) {
    taxonomyTypes(kind: $kind, active: $active) {
      id
      label
      kind
    }
  }
`;

// Mutation for applying taxonomies to gym images
const APPLY_TAXONOMIES = gql`
  mutation ApplyTaxonomies($input: ApplyTaxonomiesInput!) {
    applyTaxonomiesToGymImages(input: $input) {
      updatedCount
    }
  }
`;

// Fetch active taxonomy options for a given kind
export function useTaxonomyOptions(kind: string) {
  return useQuery(TAXONOMY_OPTIONS, {
    variables: {kind, active: true},
    fetchPolicy: 'network-only',
  });
}

// Mutation hook for applying taxonomy values
export function useApplyTaxonomies() {
  return useMutation(APPLY_TAXONOMIES);
}

export type TaxonomyOption = {id: number; label: string};
