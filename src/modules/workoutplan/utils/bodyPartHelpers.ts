export function getSelectedBodyPartIds(
  selectedGroupIds: number[],
  allGroups: any[],
): number[] {
  const bodyPartSet = new Set<number>();
  for (const group of allGroups) {
    if (selectedGroupIds.includes(group.id)) {
      for (const bp of group.bodyParts || []) {
        bodyPartSet.add(bp.id);
      }
    }
  }
  return Array.from(bodyPartSet);
}

export function filterExercisesByBodyParts(
  exercises: any[],
  selectedBodyPartIds: number[],
) {
  const idSet = new Set(selectedBodyPartIds);
  return exercises.filter(ex =>
    ex.primaryMuscles?.some((m: any) => m.bodyPart && idSet.has(m.bodyPart.id)),
  );
}