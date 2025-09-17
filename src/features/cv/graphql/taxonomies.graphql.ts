import { gql } from '@apollo/client';

export const LIST_TAXONOMY = gql`
  query TaxonomyTypes($kind: TaxonomyKind!, $active: Boolean) {
    taxonomyTypes(kind: $kind, active: $active) {
      id
      key
      label
      active
      displayOrder
      kind
      __typename
    }
  }
`;

export const CREATE_TAXONOMY = gql`
  mutation CreateTaxonomy($kind: TaxonomyKind!, $input: CreateTaxonomyInput!) {
    createTaxonomyType(kind: $kind, input: $input) {
      id
      key
      label
      active
      displayOrder
      kind
      __typename
    }
  }
`;

export const UPDATE_TAXONOMY = gql`
  mutation UpdateTaxonomy($kind: TaxonomyKind!, $id: Int!, $input: UpdateTaxonomyInput!) {
    updateTaxonomyType(kind: $kind, id: $id, input: $input) {
      id
      key
      label
      active
      displayOrder
      kind
      __typename
    }
  }
`;

export const SET_TAXONOMY_ACTIVE = gql`
  mutation SetTaxonomyActive($kind: TaxonomyKind!, $id: Int!, $active: Boolean!) {
    setTaxonomyActive(kind: $kind, id: $id, active: $active) {
      id
      key
      label
      active
      displayOrder
      kind
      __typename
    }
  }
`;
