import { useQuery } from '@apollo/client';
import React from 'react';
import { ScrollView, View, Image } from 'react-native';
import { useParams } from 'react-router-native';

import { GET_EXERCISE_DETAIL } from 'src/features/exercises/graphql/exercise.graphql';
import {
  ExerciseEquipmentSlot,
  ExerciseEquipmentOption,
  Muscle,
} from 'src/features/exercises/types/exercise.types';
import Button from 'src/shared/components/Button';
import Card from 'src/shared/components/Card';
import DetailField from 'src/shared/components/DetailField';
import LoadingState from 'src/shared/components/LoadingState';
import NoResults from 'src/shared/components/NoResults';
import ScreenLayout from 'src/shared/components/ScreenLayout';
import Title from 'src/shared/components/Title';
import { spacing } from 'src/shared/theme/tokens';

export default function ExerciseDetailScreen() {
  const { exerciseId } = useParams<{ exerciseId: string }>();

  const { data, loading, error } = useQuery(GET_EXERCISE_DETAIL, {
    variables: { id: Number(exerciseId) },
    skip: !exerciseId,
  });

  const exercise = data?.getExerciseById;

  function groupMusclesByBodyPart(muscles: Muscle[] = []) {
    const groupedMap = new Map<string, string[]>();

    for (const muscle of muscles) {
      const part = muscle.bodyPart?.name ?? 'Other';
      if (!groupedMap.has(part)) groupedMap.set(part, []);
      groupedMap.get(part)!.push(muscle.name);
    }

    // Sort muscle names within each body part
    for (const [part, names] of groupedMap.entries()) {
      names.sort((a, b) => a.localeCompare(b));
    }

    // Convert to object sorted by body part name
    return Object.fromEntries(
      Array.from(groupedMap.entries()).sort(([a], [b]) => a.localeCompare(b)),
    );
  }

  if (loading) return <LoadingState text="Loading exercise..." />;
  if (error || !exercise) return <NoResults message="Exercise not found." />;

  return (
    <ScreenLayout scroll>
      <Card title={exercise.name} />

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <Card>
          <Title text="Exercise Info" />
          <DetailField label="Difficulty" value={exercise.difficulty.level} />

          {exercise.description ? (
            <>
              <Title text="Description" />
              <DetailField label="Overview" value={exercise.description} vertical />
            </>
          ) : null}

          {exercise.videoUrl ? (
            <>
              <Title text="Demo Video" />
              {/* Replace with actual video component */}
              <Image
                source={{ uri: exercise.videoUrl }}
                style={{ height: 200, borderRadius: spacing.sm }}
              />
            </>
          ) : null}

          <Title text="Muscles Worked" />
          <Title subtitle="Primary" />
          {Object.entries(groupMusclesByBodyPart(exercise.primaryMuscles)).map(
            ([bodyPart, muscleNames]) => (
              <DetailField key={bodyPart} label={bodyPart} value={muscleNames.join(', ')} />
            ),
          )}
          {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
            <>
              <Title subtitle="Secondary" />
              {Object.entries(groupMusclesByBodyPart(exercise.secondaryMuscles)).map(
                ([bodyPart, muscleNames]) => (
                  <DetailField key={bodyPart} label={bodyPart} value={muscleNames.join(', ')} />
                ),
              )}
            </>
          )}
        </Card>

        <Card>
          <Title text="Required equipment" />
          {(exercise.equipmentSlots ?? []).map((slot: ExerciseEquipmentSlot, idx: number) => (
            <View key={idx} style={{ marginBottom: spacing.md }}>
              <DetailField
                label={slot.comment?.trim() || `Slot ${slot.slotIndex + 1}`}
                value={
                  slot.options
                    .map(
                      (opt: ExerciseEquipmentOption) =>
                        `${opt.subcategory.name} (${opt.subcategory.category.name})`,
                    )
                    .join(' / ') || 'No options'
                }
              />
            </View>
          ))}
        </Card>

        <View style={{ marginTop: spacing.lg }}>
          <Button text="Try in Workout" onPress={() => console.log('Add to session')} />
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
