import React, { useState } from 'react';
import { Text } from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { Pressable, View } from 'react-native';
import { useTheme } from 'shared/theme/ThemeProvider';

type Exercise = {
  id: string;
  name: string;
};

const initialExercises: Exercise[] = [
  { id: 'ex-1', name: 'Bench Press' },
  { id: 'ex-2', name: 'Pull-ups' },
  { id: 'ex-3', name: 'Squats' },
  { id: 'ex-4', name: 'Deadlift' },
];

export default function DraggableExerciseDemo() {
  const [exercises, setExercises] = useState(initialExercises);
  const { theme, componentStyles } = useTheme();

  return (
    <View style={{ flex: 1, paddingTop: 60, backgroundColor: theme.colors.background }}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: 'bold',
          marginHorizontal: 16,
          marginBottom: 12,
          color: theme.colors.textPrimary,
        }}
      >
        Drag Exercises to Reorder
      </Text>

      <DraggableFlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        onDragEnd={({ data }) => setExercises(data)}
        renderItem={({ item, drag, isActive }) => (
          <ScaleDecorator>
            <Pressable
              onLongPress={drag}
              style={({ pressed }) => [
                {
                  backgroundColor: isActive
                    ? theme.colors.accentStart
                    : pressed
                    ? theme.colors.surface
                    : theme.colors.featureCardBackground,
                  padding: 16,
                  marginHorizontal: 16,
                  marginVertical: 6,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.colors.accentStart,
                },
              ]}
            >
              <Text style={{ fontSize: 16, color: theme.colors.textPrimary }}>
                {item.name}
              </Text>
            </Pressable>
          </ScaleDecorator>
        )}
      />
    </View>
  );
}
