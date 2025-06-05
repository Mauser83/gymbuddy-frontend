import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import Card from 'shared/components/Card';
import FormInput from 'shared/components/FormInput';
import Button from 'shared/components/Button';
import ClickableList from 'shared/components/ClickableList';
import ButtonRow from 'shared/components/ButtonRow';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useTheme } from 'shared/theme/ThemeProvider';
import { useReferenceManagement } from 'modules/exercise/hooks/useReferenceManagement';
import DividerWithLabel from 'shared/components/DividerWithLabel';

export default function AdminExerciseCatalogScreen() {
  const { theme } = useTheme();
  const [mode, setMode] = useState<'type' | 'difficulty' | 'bodyPart' | 'muscle'>('type');
  const [selectedBodyPartId, setSelectedBodyPartId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [newValue, setNewValue] = useState('');
  const [edits, setEdits] = useState<Record<number, string>>({});

  const currentMode = mode === 'muscle' && selectedBodyPartId === null ? 'bodyPart' : mode;
  const { data, refetch, createItem, updateItem, deleteItem } =
    useReferenceManagement(currentMode, selectedBodyPartId || undefined);

  const titleMap: Record<string, string> = {
    type: 'Exercise Types',
    difficulty: 'Exercise Difficulties',
    bodyPart: 'Body Parts',
    muscle: 'Muscles',
  };

  const items = (data || []).slice().sort((a: any, b: any) => {
    const aVal = 'name' in a ? a.name : 'level' in a ? a.level : '';
    const bVal = 'name' in b ? b.name : 'level' in b ? b.level : '';
    return aVal.localeCompare(bVal);
  }).map((item: any) => {
    const label = 'name' in item ? item.name : 'level' in item ? item.level : '';
    return {
      id: item.id,
      label,
      selected: expandedId === item.id,
      rightElement: expandedId === item.id ? (
        <FontAwesome name="chevron-down" size={16} color={theme.colors.accentStart} />
      ) : null,
      onPress: () => {
        if (mode === 'muscle' && selectedBodyPartId === null) {
          setSelectedBodyPartId(item.id);
        } else {
          setExpandedId(prev => (prev === item.id ? null : item.id));
          setEdits(prev => ({ ...prev, [item.id]: label }));
        }
      },
      content: expandedId === item.id && (
        <>
          <FormInput
            label="Name"
            value={edits[item.id] || ''}
            onChangeText={val => setEdits(prev => ({ ...prev, [item.id]: val }))}
          />
          <ButtonRow>
            <Button
              text="Update"
              fullWidth
              disabled={!edits[item.id] || edits[item.id] === label}
              onPress={() => updateItem(item.id, edits[item.id] || label).then(refetch)}
            />
            <Button
              text="Delete"
              fullWidth
              onPress={() => deleteItem(item.id).then(refetch)}
            />
          </ButtonRow>
        </>
      )
    };
  });

  const handleCreate = async () => {
    await createItem(newValue);
    setNewValue('');
    refetch();
  };

  const catalogSections: { key: typeof mode; label: string }[] = [
    { key: 'type', label: 'Exercise Types' },
    { key: 'difficulty', label: 'Difficulties' },
    { key: 'bodyPart', label: 'Body Parts' },
    { key: 'muscle', label: 'Muscles' },
  ];

  return (
    <ScreenLayout scroll>
      <Title text="Manage Exercise Reference Data" subtitle="Admin-only control for metadata" />

      <ScrollView>
        {catalogSections.map(section => (
          <Card key={section.key}>
            <Title text={section.label} />
            {mode === section.key && (
              <>
                <FormInput
                  label={section.key === 'difficulty' ? 'New Difficulty' : `New ${section.label.slice(0, -1)}`}
                  value={newValue}
                  onChangeText={setNewValue}
                />
                <ButtonRow>
                  <Button text="Create" fullWidth onPress={handleCreate} />
                </ButtonRow>
                <DividerWithLabel label={section.label} />
                <ClickableList items={items} />
              </>
            )}
            {mode !== section.key && (
              <ClickableList
                items={[
                  {
                    id: section.key,
                    label: `View and manage ${section.label.toLowerCase()}`,
                    onPress: () => {
                      setMode(section.key);
                      setExpandedId(null);
                      setNewValue('');
                      setSelectedBodyPartId(null);
                    },
                  },
                ]}
              />
            )}
          </Card>
        ))}
      </ScrollView>
    </ScreenLayout>
  );
}
