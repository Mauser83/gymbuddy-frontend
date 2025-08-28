import {useEffect, useState} from 'react';
import {useListTaxonomy} from 'features/cv/hooks/useTaxonomies';

export function useTagNameMaps() {
  const {rows: angles} = useListTaxonomy('angle');
  const {rows: splits} = useListTaxonomy('split');
  const {rows: sources} = useListTaxonomy('source');

  const [maps, setMaps] = useState({
    angle: new Map<number, string>(),
    split: new Map<number, string>(),
    source: new Map<number, string>(),
  });

  useEffect(() => {
    const m = (arr?: {id: number; name: string}[]) =>
      new Map((arr ?? []).map(a => [a.id, a.name]));
    setMaps({angle: m(angles), split: m(splits), source: m(sources)});
  }, [angles, splits, sources]);

  return maps;
}