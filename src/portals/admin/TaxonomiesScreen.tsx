import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Toast from 'react-native-toast-message';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import {
  useListTaxonomy,
  useCreateTaxonomy,
  useUpdateTaxonomy,
  TaxonomyType,
  TaxonomyRow,
} from 'src/features/cv/hooks/useTaxonomies';
import Button from 'src/shared/components/Button';
import Card from 'src/shared/components/Card';
import FormError from 'src/shared/components/FormError';
import FormInput from 'src/shared/components/FormInput';
import LoadingState from 'src/shared/components/LoadingState';
import ModalWrapper from 'src/shared/components/ModalWrapper';
import NoResults from 'src/shared/components/NoResults';
import ScreenLayout from 'src/shared/components/ScreenLayout';
import SearchInput from 'src/shared/components/SearchInput';
import Title from 'src/shared/components/Title';
import { useTheme } from 'src/shared/theme/ThemeProvider';
import { spacing, fontWeights, borderWidth } from 'src/shared/theme/tokens';

const TABS: { key: TaxonomyType; label: string }[] = [
  { key: 'angle', label: 'Angle' },
  { key: 'height', label: 'Height' },
  { key: 'lighting', label: 'Lighting' },
  { key: 'mirror', label: 'Mirror' },
  { key: 'distance', label: 'Distance' },
  { key: 'source', label: 'Source' },
  { key: 'split', label: 'Split' },
];

const TaxonomiesScreen = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TaxonomyType>('angle');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{
    mode: 'create' | 'edit';
    row?: TaxonomyRow;
  } | null>(null);
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);
  const [error, setError] = useState('');
  const [scrollX, setScrollX] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  useEffect(() => {
    setShowLeft(scrollX > 0);
    setShowRight(scrollX + containerWidth < contentWidth);
  }, [scrollX, containerWidth, contentWidth]);
  const { rows, loading, refetch } = useListTaxonomy(activeTab);
  const [createTaxonomy, { loading: creating }] = useCreateTaxonomy(activeTab);
  const [updateTaxonomy, { loading: updating }] = useUpdateTaxonomy(activeTab);

  const filtered = rows.filter((r: TaxonomyRow) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setName('');
    setActive(true);
    setError('');
    setModal({ mode: 'create' });
  };

  const openEdit = (row: TaxonomyRow) => {
    setName(row.name);
    setActive(row.active);
    setError('');
    setModal({ mode: 'edit', row });
  };

  const closeModal = () => setModal(null);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const nextDisplayOrder = Math.max(0, ...rows.map((r) => r.displayOrder || 0)) + 1;
    try {
      await createTaxonomy({
        variables: { name: trimmed, displayOrder: nextDisplayOrder },
      });
      Toast.show({ type: 'success', text1: 'Created' });
      closeModal();
      refetch();
    } catch (e: any) {
      if (typeof e.message === 'string' && /unique|already exists/i.test(e.message)) {
        setError('That name is already in use');
      } else {
        setError('Could not create item. Check required fields.');
      }
      Toast.show({ type: 'error', text1: 'Failed to create' });
    }
  };

  const handleEdit = async () => {
    if (!modal?.row) return;
    const trimmed = name.trim();
    try {
      await updateTaxonomy({
        variables: { id: modal.row.id, name: trimmed, active },
      });
      Toast.show({ type: 'success', text1: 'Updated' });
      closeModal();
      refetch();
    } catch (e: any) {
      if (typeof e.message === 'string' && /unique|already exists/i.test(e.message)) {
        setError('That name is already in use');
      }
      Toast.show({ type: 'error', text1: 'Failed to update' });
    }
  };

  const toggleActive = async (row: TaxonomyRow) => {
    try {
      await updateTaxonomy({
        variables: { id: row.id, active: !row.active },
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update' });
    }
  };

  return (
    <ScreenLayout scroll>
      <Card>
        <Title text="Taxonomies" />
        <View
          style={{ marginBottom: spacing.md, overflow: 'visible' }}
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
              setScrollX(e.nativeEvent.contentOffset.x)
            }
            scrollEventThrottle={16}
            onContentSizeChange={(w) => setContentWidth(w)}
          >
            <View style={{ flexDirection: 'row' }}>
              {TABS.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => setActiveTab(t.key)}
                  style={{
                    marginRight: spacing.sm,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    borderBottomWidth: activeTab === t.key ? borderWidth.thick : 0,
                    borderColor: theme.colors.accentStart,
                  }}
                >
                  <Text
                    style={{
                      color:
                        activeTab === t.key ? theme.colors.accentStart : theme.colors.textSecondary,
                      fontWeight: fontWeights.semiBold,
                    }}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          {showLeft && (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: -spacing.lg,
                top: 0,
                bottom: 0,
                justifyContent: 'center',
              }}
            >
              <FontAwesome name="chevron-left" size={16} color={theme.colors.accentStart} />
            </View>
          )}
          {showRight && (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                right: -spacing.lg,
                top: 0,
                bottom: 0,
                justifyContent: 'center',
              }}
            >
              <FontAwesome name="chevron-right" size={16} color={theme.colors.accentStart} />
            </View>
          )}
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.md,
          }}
        >
          <View style={{ flex: 1 }}>
            <SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} />
          </View>
          <View style={{ marginLeft: spacing.sm }}>
            <Button text="New" onPress={openCreate} small />
          </View>
        </View>
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <NoResults message="No results" />
        ) : (
          <View>
            <View
              style={{
                flexDirection: 'row',
                marginBottom: spacing.sm,
              }}
            >
              <Text
                style={{
                  flex: 2,
                  color: theme.colors.textSecondary,
                  fontWeight: fontWeights.semiBold,
                }}
              >
                Name
              </Text>
              <Text
                style={{
                  width: 80,
                  color: theme.colors.textSecondary,
                  fontWeight: fontWeights.semiBold,
                }}
              >
                Active
              </Text>
              <Text
                style={{
                  width: 60,
                  color: theme.colors.textSecondary,
                  fontWeight: fontWeights.semiBold,
                  textAlign: 'right',
                }}
              >
                Action
              </Text>
            </View>
            {filtered.map((row: TaxonomyRow) => (
              <View
                key={row.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: spacing.xs,
                  borderBottomWidth: borderWidth.hairline,
                  borderColor: theme.colors.divider,
                }}
              >
                <Text style={{ flex: 2, color: theme.colors.textPrimary }}>{row.name}</Text>
                <View style={{ width: 80, alignItems: 'flex-start' }}>
                  <Switch
                    value={row.active}
                    onValueChange={() => toggleActive(row)}
                    trackColor={{
                      false: theme.colors.disabledBorder,
                      true: theme.colors.accentStart,
                    }}
                    accessibilityLabel={row.active ? 'Set inactive' : 'Set active'}
                  />
                </View>
                <View style={{ width: 60, alignItems: 'flex-end' }}>
                  <Button
                    text="Edit"
                    accessibilityLabel={`Edit ${row.name}`}
                    small
                    onPress={() => openEdit(row)}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>
      <ModalWrapper visible={!!modal} onClose={closeModal}>
        <View style={{ padding: spacing.lg }}>
          <Title
            align="left"
            text={`${modal?.mode === 'create' ? 'Create' : 'Edit'} ${TABS.find((t) => t.key === activeTab)?.label}`}
          />
          <FormInput
            label="Name"
            value={name}
            onChangeText={setName}
            onSubmitEditing={modal?.mode === 'create' ? handleCreate : handleEdit}
            returnKeyType="done"
          />
          {modal?.mode === 'edit' && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: spacing.md,
              }}
            >
              <Text
                style={{
                  color: theme.colors.textPrimary,
                  marginRight: spacing.sm,
                }}
              >
                Active
              </Text>
              <Switch
                value={active}
                onValueChange={setActive}
                trackColor={{
                  false: theme.colors.disabledBorder,
                  true: theme.colors.accentStart,
                }}
              />
            </View>
          )}
          {error ? <FormError message={error} /> : null}
          <Button
            text="Save"
            onPress={modal?.mode === 'create' ? handleCreate : handleEdit}
            disabled={creating || updating}
            fullWidth
          />
        </View>
      </ModalWrapper>
    </ScreenLayout>
  );
};

export default TaxonomiesScreen;
