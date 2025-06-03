import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Title from 'shared/components/Title';
import OptionItem from 'shared/components/OptionItem';
import Button from 'shared/components/Button';
import { spacing } from 'shared/theme/tokens';
import { useAuth } from 'modules/auth/context/AuthContext';
import EditMuscleGroupModal from './EditMuscleGroupModal';
import type { MuscleGroup } from './EditMuscleGroupModal';

interface Props {
  muscleGroups: MuscleGroup[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  onClose: () => void;
  bodyPartOptions: { id: number; name: string }[];
  onRefetch: () => Promise<any>;
}

export default function MuscleGroupPickerModal({
  muscleGroups,
  selectedIds,
  onChange,
  onClose,
  bodyPartOptions,
  onRefetch,
}: Props) {
  const { user } = useAuth();
  const [editTarget, setEditTarget] = useState<MuscleGroup | null>(null);

  const toggleSelection = (id: number) => {
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    onChange(newIds);
  };

  const canManage = user?.appRole === 'ADMIN' || user?.appRole === 'MODERATOR';

  return (
    <>
      <Title text="Select Muscle Groups" />
      <ScrollView style={{ maxHeight: 400 }}>
        {muscleGroups
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(group => (
            <OptionItem
              key={group.id}
              text={group.name}
              selected={selectedIds.includes(group.id)}
              onPress={() => toggleSelection(group.id)}
              onLongPress={
                canManage
                  ? () => setEditTarget({ ...group, bodyParts: group.bodyParts || [] })
                  : undefined
              }
            />
          ))}
      </ScrollView>

      <View style={{ marginTop: spacing.md }}>
        <Button text="Close" onPress={onClose} />
      </View>

      {user && (user.appRole === 'ADMIN' || user.appRole === 'MODERATOR') && (
        <View style={{ marginTop: spacing.md }}>
          <Button
            text="Manage Muscle Groups"
            onPress={() => setEditTarget({ id: 0, name: '', bodyParts: [] })}
          />
        </View>
      )}

      {editTarget && (
        <EditMuscleGroupModal
          visible
          muscleGroup={editTarget}
          bodyPartOptions={bodyPartOptions}
          onClose={() => setEditTarget(null)}
          onSave={async (name, bodyPartIds) => {
            // Editing an existing group
            setEditTarget(null);
            await onRefetch();
          }}
        />
      )}
    </>
  );
}
