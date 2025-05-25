import React from 'react';
import {ScrollView, View, Image} from 'react-native';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import Card from 'shared/components/Card';
import DetailField from 'shared/components/DetailField';
import Button from 'shared/components/Button';
import {spacing} from 'shared/theme/tokens';
import { useParams } from 'react-router-native';
// Replace with real query & types once API is ready
// import { useQuery } from '@apollo/client';
// import { GET_EXERCISE_DETAIL } from '../graphql/exercise.graphql';

export default function ExerciseDetailScreen() {
  const {exerciseId} = useParams<{exerciseId: string}>();

  // const { data, loading } = useQuery(GET_EXERCISE_DETAIL, {
  //   variables: { id: exerciseId },
  // });

  // Placeholder data
  const exercise = {
    name: 'Barbell Squat',
    description: 'A compound lower-body movement targeting quads and glutes.',
    videoUrl: null, // Replace with real embed or thumbnail
    primaryMuscles: ['Quadriceps'],
    secondaryMuscles: ['Glutes', 'Hamstrings'],
    difficulty: 'Intermediate',
    equipment: ['Barbell', 'Rack'],
  };

  return (
    <ScreenLayout scroll>
      <Title text={exercise.name} />

      <ScrollView contentContainerStyle={{paddingBottom: spacing.xl}}>
        <Card title="Description">
          <DetailField label="Overview" value={exercise.description} vertical />
        </Card>

        {exercise.videoUrl ? (
          <Card title="Demo Video">
            {/* Replace with actual video component */}
            <Image source={{uri: exercise.videoUrl}} style={{height: 200, borderRadius: spacing.sm}} />
          </Card>
        ) : null}

        <Card title="Muscles Worked">
          <DetailField label="Primary" value={exercise.primaryMuscles.join(', ')} />
          <DetailField label="Secondary" value={exercise.secondaryMuscles.join(', ')} />
        </Card>

        <Card title="Exercise Info">
          <DetailField label="Difficulty" value={exercise.difficulty} />
          <DetailField label="Equipment" value={exercise.equipment.join(', ')} />
        </Card>

        <View style={{marginTop: spacing.lg}}>
          <Button text="Try in Workout" onPress={() => console.log('Add to session')} />
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
