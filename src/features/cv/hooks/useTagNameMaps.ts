import {useEffect, useState} from 'react';
import {useListTaxonomy} from 'features/cv/hooks/useTaxonomies';

export function useTagNameMaps() {
  const {rows: angles} = useListTaxonomy('angle');
  const {rows: heights} = useListTaxonomy('height');
  const {rows: distances} = useListTaxonomy('distance');
  const {rows: lightings} = useListTaxonomy('lighting');
  const {rows: mirrors} = useListTaxonomy('mirror');
  const {rows: splits} = useListTaxonomy('split');
  const {rows: sources} = useListTaxonomy('source');

  const [maps, setMaps] = useState({
    angle: new Map<number, string>(),
    height: new Map<number, string>(),
    distance: new Map<number, string>(),
    lighting: new Map<number, string>(),
    mirror: new Map<number, string>(),
    split: new Map<number, string>(),
    source: new Map<number, string>(),
  });

  useEffect(() => {
    const m = (arr?: {id: number; name: string}[]) =>
      new Map((arr ?? []).map(a => [a.id, a.name]));
    setMaps({
      angle: m(angles),
      height: m(heights),
      distance: m(distances),
      lighting: m(lightings),
      mirror: m(mirrors),
      split: m(splits),
      source: m(sources),
    });
  }, [angles, heights, distances, lightings, mirrors, splits, sources]);

  return maps;
}