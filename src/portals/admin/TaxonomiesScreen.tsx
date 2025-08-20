import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Switch} from 'react-native';
import Toast from 'react-native-toast-message';
import ScreenLayout from 'shared/components/ScreenLayout';
import Card from 'shared/components/Card';
import Button from 'shared/components/Button';
import SearchInput from 'shared/components/SearchInput';
import FormInput from 'shared/components/FormInput';
import FormError from 'shared/components/FormError';
import ModalWrapper from 'shared/components/ModalWrapper';
import NoResults from 'shared/components/NoResults';
import LoadingState from 'shared/components/LoadingState';
import {useTheme} from 'shared/theme/ThemeProvider';
import {
  spacing,
  fontSizes,
  fontWeights,
  borderWidth,
} from 'shared/theme/tokens';
import {
  useListTaxonomy,
  useCreateTaxonomy,
  useUpdateTaxonomy,
  TaxonomyType,
  TaxonomyRow,
  TAXONOMY_META,
} from 'features/cv/hooks/useTaxonomies';

const TABS: {key: TaxonomyType; label: string}[] = [
  {key: 'angle', label: 'Angle'},
  {key: 'height', label: 'Height'},
  {key: 'lighting', label: 'Lighting'},
  {key: 'mirror', label: 'Mirror'},
  {key: 'distance', label: 'Distance'},
  {key: 'source', label: 'Source'},
  {key: 'split', label: 'Split'},
];

const TaxonomiesScreen = () => {
  const {theme} = useTheme();
  const [activeTab, setActiveTab] = useState<TaxonomyType>('angle');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<
    {mode: 'create' | 'edit'; row?: TaxonomyRow} | null
  >(null);
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);
  const [error, setError] = useState('');

  const {rows, loading, refetch} = useListTaxonomy(activeTab);
  const [createTaxonomy, {loading: creating}] = useCreateTaxonomy(activeTab);
  const [updateTaxonomy, {loading: updating}] = useUpdateTaxonomy(activeTab);

  const filtered = rows.filter((r: TaxonomyRow) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setName('');
    setActive(true);
    setError('');
    setModal({mode: 'create'});
  };

  const openEdit = (row: TaxonomyRow) => {
    setName(row.name);
    setActive(row.active);
    setError('');
    setModal({mode: 'edit', row});
  };

  const closeModal = () => setModal(null);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await createTaxonomy({variables: {name: trimmed}});
      Toast.show({type: 'success', text1: 'Created'});
      closeModal();
      refetch();
    } catch (e: any) {
      if (typeof e.message === 'string' && e.message.toLowerCase().includes('unique')) {
        setError('That name is already in use');
      }
      Toast.show({type: 'error', text1: 'Failed to create'});
    }
  };

  const handleEdit = async () => {
    if (!modal?.row) return;
    const trimmed = name.trim();
    try {
      await updateTaxonomy({
        variables: {id: modal.row.id, name: trimmed, active},
      });
      Toast.show({type: 'success', text1: 'Updated'});
      closeModal();
      refetch();
    } catch (e: any) {
      if (typeof e.message === 'string' && e.message.toLowerCase().includes('unique')) {
        setError('That name is already in use');
      }
      Toast.show({type: 'error', text1: 'Failed to update'});
    }
  };

  const toggleActive = async (row: TaxonomyRow) => {
    const meta = TAXONOMY_META[activeTab];
    try {
      await updateTaxonomy({
        variables: {id: row.id, name: row.name, active: !row.active},
        optimisticResponse: {
          [meta.updateField]: {
            __typename: meta.typename,
            id: row.id,
            name: row.name,
            active: !row.active,
          },
        },
      });
    } catch (e) {
      Toast.show({type: 'error', text1: 'Failed to update'});
    }
  };

  return (
    <ScreenLayout scroll>
      <Card>
        <Text
          style={{
            fontSize: fontSizes.xl,
            fontWeight: fontWeights.bold,
            color: theme.colors.textPrimary,
            marginBottom: spacing.md,
          }}>
          Taxonomies
        </Text>
        <View style={{flexDirection: 'row', marginBottom: spacing.md}}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={{
                marginRight: spacing.sm,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                borderBottomWidth:
                  activeTab === t.key ? borderWidth.thick : 0,
                borderColor: theme.colors.accentStart,
              }}>
              <Text
                style={{
                  color:
                    activeTab === t.key
                      ? theme.colors.accentStart
                      : theme.colors.textSecondary,
                  fontWeight: fontWeights.semiBold,
                }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.md,
          }}>
          <View style={{flex: 1}}>
            <SearchInput
              value={search}
              onChange={setSearch}
              onClear={() => setSearch('')}
            />
          </View>
          <View style={{marginLeft: spacing.sm}}>
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
              }}>
              <Text
                style={{
                  flex: 2,
                  color: theme.colors.textSecondary,
                  fontWeight: fontWeights.semiBold,
                }}>
                Name
              </Text>
              <Text
                style={{
                  flex: 1,
                  color: theme.colors.textSecondary,
                  fontWeight: fontWeights.semiBold,
                }}>
                Active
              </Text>
              <Text
                style={{
                  flex: 1,
                  color: theme.colors.textSecondary,
                  fontWeight: fontWeights.semiBold,
                }}>
                Actions
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
                }}>
                <Text style={{flex: 2, color: theme.colors.textPrimary}}>
                  {row.name}
                </Text>
                <Text style={{flex: 1, color: theme.colors.textPrimary}}>
                  {row.active ? 'Active' : 'Disabled'}
                </Text>
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                  }}>
                  <Button text="Edit" onPress={() => openEdit(row)} small />
                  <View style={{width: spacing.sm}} />
                  <Button
                    text={row.active ? 'Disable' : 'Enable'}
                    onPress={() => toggleActive(row)}
                    small
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>
      <ModalWrapper visible={!!modal} onClose={closeModal}>
        <View style={{padding: spacing.lg}}>
          <Text
            style={{
              fontSize: fontSizes.lg,
              fontWeight: fontWeights.bold,
              color: theme.colors.textPrimary,
              marginBottom: spacing.md,
            }}>
            {modal?.mode === 'create' ? 'Create' : 'Edit'}{' '}
            {TABS.find(t => t.key === activeTab)?.label}
          </Text>
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
              }}>
              <Text
                style={{
                  color: theme.colors.textPrimary,
                  marginRight: spacing.sm,
                }}>
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
          {error && <FormError message={error} />}
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