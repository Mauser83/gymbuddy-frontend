import {DocumentNode} from 'graphql';
import {useQuery, useMutation} from '@apollo/client';
import {
  LIST_ANGLES,
  CREATE_ANGLE,
  UPDATE_ANGLE,
  LIST_HEIGHTS,
  CREATE_HEIGHT,
  UPDATE_HEIGHT,
  LIST_LIGHTING,
  CREATE_LIGHTING,
  UPDATE_LIGHTING,
  LIST_MIRRORS,
  CREATE_MIRROR,
  UPDATE_MIRROR,
  LIST_DISTANCES,
  CREATE_DISTANCE,
  UPDATE_DISTANCE,
  LIST_SOURCES,
  CREATE_SOURCE,
  UPDATE_SOURCE,
  LIST_SPLITS,
  CREATE_SPLIT,
  UPDATE_SPLIT,
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
}

type Meta = {
  list: DocumentNode;
  listField: string;
  create: DocumentNode;
  update: DocumentNode;
  updateField: string;
  typename: string;
};

export const TAXONOMY_META: Record<TaxonomyType, Meta> = {
  angle: {
    list: LIST_ANGLES,
    listField: 'angles',
    create: CREATE_ANGLE,
    update: UPDATE_ANGLE,
    updateField: 'updateAngle',
    typename: 'Angle',
  },
  height: {
    list: LIST_HEIGHTS,
    listField: 'heights',
    create: CREATE_HEIGHT,
    update: UPDATE_HEIGHT,
    updateField: 'updateHeight',
    typename: 'Height',
  },
  lighting: {
    list: LIST_LIGHTING,
    listField: 'lighting',
    create: CREATE_LIGHTING,
    update: UPDATE_LIGHTING,
    updateField: 'updateLighting',
    typename: 'Lighting',
  },
  mirror: {
    list: LIST_MIRRORS,
    listField: 'mirrors',
    create: CREATE_MIRROR,
    update: UPDATE_MIRROR,
    updateField: 'updateMirror',
    typename: 'Mirror',
  },
  distance: {
    list: LIST_DISTANCES,
    listField: 'distances',
    create: CREATE_DISTANCE,
    update: UPDATE_DISTANCE,
    updateField: 'updateDistance',
    typename: 'Distance',
  },
  source: {
    list: LIST_SOURCES,
    listField: 'sources',
    create: CREATE_SOURCE,
    update: UPDATE_SOURCE,
    updateField: 'updateSource',
    typename: 'Source',
  },
  split: {
    list: LIST_SPLITS,
    listField: 'splits',
    create: CREATE_SPLIT,
    update: UPDATE_SPLIT,
    updateField: 'updateSplit',
    typename: 'Split',
  },
};

export function useListTaxonomy(type: TaxonomyType) {
  const meta = TAXONOMY_META[type];
  const query = useQuery<{[key: string]: TaxonomyRow[]}>(meta.list);
  const rows = query.data ? (query.data as any)[meta.listField] : [];
  return {...query, rows};
}

export function useCreateTaxonomy(type: TaxonomyType) {
  const meta = TAXONOMY_META[type];
  return useMutation(meta.create);
}

export function useUpdateTaxonomy(type: TaxonomyType) {
  const meta = TAXONOMY_META[type];
  return useMutation(meta.update);
}
