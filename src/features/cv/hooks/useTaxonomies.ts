import {useMemo} from 'react';
import {useQuery, useMutation} from '@apollo/client';
import {
  LIST_TAXONOMY,
  CREATE_TAXONOMY,
  UPDATE_TAXONOMY,
  SET_TAXONOMY_ACTIVE,
} from '../graphql/taxonomies.graphql';

export type TaxonomyType =
  | 'angle'
  | 'height'
  | 'lighting'
  | 'mirror'
  | 'distance'
  | 'source'
  | 'split';

export interface TaxonomyRow {
  id: number;
  name: string;
  active: boolean;
  displayOrder: number;
}

const KIND: Record<
  TaxonomyType,
  'ANGLE' | 'HEIGHT' | 'LIGHTING' | 'MIRROR' | 'DISTANCE' | 'SOURCE' | 'SPLIT'
> = {
  angle: 'ANGLE',
  height: 'HEIGHT',
  lighting: 'LIGHTING',
  mirror: 'MIRROR',
  distance: 'DISTANCE',
  source: 'SOURCE',
  split: 'SPLIT',
};

// Quick slug for required "key" in CreateTaxonomyInput
const slug = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

export function useListTaxonomy(type: TaxonomyType) {
  // Fetch both active and inactive so the table shows everything.
  // (Your schema defaults active=true if omitted.)
  const q1 = useQuery(LIST_TAXONOMY, {
    variables: {kind: KIND[type], active: true},
  });
  const q0 = useQuery(LIST_TAXONOMY, {
    variables: {kind: KIND[type], active: false},
  });
  const loading = q1.loading || q0.loading;

  const rows: TaxonomyRow[] = useMemo(() => {
    const all = [
      ...(q1.data?.taxonomyTypes ?? []),
      ...(q0.data?.taxonomyTypes ?? []),
    ];
    return all
      .sort((a: any, b: any) => a.displayOrder - b.displayOrder || a.id - b.id)
      .map((r: any) => ({
        id: r.id,
        name: r.label,
        active: r.active,
        displayOrder: r.displayOrder ?? 0,
      }));
  }, [q1.data, q0.data]);

  const refetch = async () => {
    await Promise.all([q1.refetch(), q0.refetch()]);
  };

  return {rows, loading, refetch, error: q1.error ?? q0.error};
}

export function useCreateTaxonomy(type: TaxonomyType) {
  const [mutate, state] = useMutation(CREATE_TAXONOMY);
  return [
    (opts: {variables: {name: string; displayOrder?: number}}) => {
      const label = opts.variables.name.trim();
      const key = slug(label);
      const input: any = {key, label};
      if (opts.variables.displayOrder != null) {
        input.displayOrder = opts.variables.displayOrder;
      }
      return mutate({variables: {kind: KIND[type], input}});
    },
    state,
  ] as const;
}

export function useUpdateTaxonomy(type: TaxonomyType) {
  // For the Edit modal (rename and/or active change together)
  const [update, updateState] = useMutation(UPDATE_TAXONOMY);
  // For inline active toggle (cleaner optimistic updates)
  const [setActive, setActiveState] = useMutation(SET_TAXONOMY_ACTIVE);

  return [
    (opts: {variables: {id: number; name?: string; active?: boolean}}) => {
      const {id, name, active} = opts.variables;
      if (name !== undefined && active !== undefined) {
        // Edit modal save: send both in one update
        return update({
          variables: {kind: KIND[type], id, input: {label: name, active}},
        });
      }
      if (active !== undefined) {
        // Inline toggle: dedicated mutation
        return setActive({variables: {kind: KIND[type], id, active}});
      }
      if (name !== undefined) {
        return update({
          variables: {kind: KIND[type], id, input: {label: name}},
        });
      }
      return Promise.resolve();
    },
    {loading: updateState.loading || setActiveState.loading},
  ] as const;
}