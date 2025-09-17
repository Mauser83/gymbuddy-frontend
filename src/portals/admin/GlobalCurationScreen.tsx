import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import React, { useState, useEffect, useMemo } from 'react';
import { View, Image, Text, TextInput, FlatList, ScrollView } from 'react-native';

import {
  LIST_GLOBAL_SUGGESTIONS,
  APPROVE_GLOBAL_SUGGESTION,
  REJECT_GLOBAL_SUGGESTION,
} from 'src/features/cv/graphql/globalCuration.graphql';
import { GET_ALL_EQUIPMENTS } from 'src/features/equipment/graphql/equipment.graphql';
import Button from 'src/shared/components/Button';
import ButtonRow from 'src/shared/components/ButtonRow';
import Card from 'src/shared/components/Card';
import ClickableList from 'src/shared/components/ClickableList';
import FormInput from 'src/shared/components/FormInput';
import LoadingState from 'src/shared/components/LoadingState';
import ModalWrapper from 'src/shared/components/ModalWrapper';
import NoResults from 'src/shared/components/NoResults';
import ScreenLayout from 'src/shared/components/ScreenLayout';
import SearchInput from 'src/shared/components/SearchInput';
import SelectableField from 'src/shared/components/SelectableField';
import Title from 'src/shared/components/Title';
import { spacing } from 'src/shared/theme/tokens';

const STATUS_TABS = ['PENDING', 'APPROVED', 'REJECTED'] as const;

type Suggestion = {
  id: string;
  equipmentId: number;
  equipment: {
    id: number;
    name: string;
  };
  storageKey: string;
  url: string;
  sha256: string;
  usefulnessScore: number;
  reasonCodes: string[];
};

const GlobalCurationScreen = () => {
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]>('PENDING');
  const [equipment, setEquipment] = useState<{ id: number; name: string } | null>(null);
  const [minScore, setMinScore] = useState('');
  const [equipmentModal, setEquipmentModal] = useState(false);
  const [equipmentSearch, setEquipmentSearch] = useState('');

  const { data, loading, refetch } = useQuery(LIST_GLOBAL_SUGGESTIONS, {
    variables: {
      input: {
        status,
        equipmentId: equipment?.id,
        minScore: minScore ? parseFloat(minScore) : undefined,
      },
    },
    fetchPolicy: 'cache-and-network',
  });

  const [approveSuggestion] = useMutation(APPROVE_GLOBAL_SUGGESTION);
  const [rejectSuggestion] = useMutation(REJECT_GLOBAL_SUGGESTION);

  const suggestions: Suggestion[] = useMemo(() => data?.listGlobalSuggestions?.items ?? [], [data]);

  const [fetchEquipments, { data: equipmentData, loading: eqLoading }] =
    useLazyQuery(GET_ALL_EQUIPMENTS);

  useEffect(() => {
    if (equipmentModal) {
      fetchEquipments({ variables: { search: equipmentSearch || undefined } });
    }
  }, [equipmentModal, equipmentSearch, fetchEquipments]);

  const equipmentOptions = useMemo(() => equipmentData?.allEquipments ?? [], [equipmentData]);

  const [rejecting, setRejecting] = useState<Suggestion | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async (id: string) => {
    await approveSuggestion({ variables: { input: { id } } });
    refetch();
  };

  const handleReject = async () => {
    if (!rejecting) return;
    await rejectSuggestion({
      variables: { input: { id: rejecting.id, reason: rejectReason || undefined } },
    });
    setRejecting(null);
    setRejectReason('');
    refetch();
  };

  const renderItem = ({ item }: { item: Suggestion }) => (
    <Card key={item.id} variant="glass" style={{ marginBottom: spacing.md }}>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Image source={{ uri: item.url }} style={{ width: 80, height: 80, borderRadius: 8 }} />
        <View style={{ flex: 1 }}>
          <Title
            text={item.equipment.name ?? `Equipment ${item.equipmentId}`}
            subtitle={`Score: ${item.usefulnessScore.toFixed(2)}`}
            align="left"
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {item.reasonCodes.map((code) => (
              <View
                key={code}
                style={{
                  backgroundColor: '#ccc',
                  borderRadius: 4,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  marginTop: 4,
                }}
              >
                <Text style={{ fontSize: 12 }}>{code}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      {status === 'PENDING' && (
        <ButtonRow style={{ marginTop: spacing.sm }}>
          <Button text="Approve" onPress={() => handleApprove(item.id)} fullWidth />
          <Button text="Reject" onPress={() => setRejecting(item)} fullWidth />
        </ButtonRow>
      )}
    </Card>
  );

  const header = (
    <>
      <Title text="🌍 Global Curation" />
      <ButtonRow style={{ marginBottom: spacing.md }}>
        {STATUS_TABS.map((s) => (
          <Button key={s} text={s} onPress={() => setStatus(s)} />
        ))}
      </ButtonRow>
      <Card variant="glass" style={{ marginBottom: spacing.md }}>
        <SelectableField
          label="Equipment"
          value={equipment ? equipment.name : 'Any equipment'}
          onPress={() => setEquipmentModal(true)}
        />
        <FormInput
          label="Min Score"
          value={minScore}
          onChangeText={setMinScore}
          keyboardType="numeric"
        />
      </Card>
    </>
  );

  return (
    <ScreenLayout dismissKeyboardOnPress={false}>
      <FlatList
        data={loading ? [] : suggestions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        ListEmptyComponent={
          loading ? (
            <LoadingState text="Loading suggestions..." />
          ) : (
            <NoResults message="No suggestions" />
          )
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />

      <ModalWrapper visible={equipmentModal} onClose={() => setEquipmentModal(false)}>
        <View style={{ gap: spacing.md }}>
          <Title text="Select Equipment" />
          <SearchInput
            value={equipmentSearch}
            onChange={setEquipmentSearch}
            placeholder="Search equipment"
            onClear={() => setEquipmentSearch('')}
          />
          {eqLoading ? (
            <LoadingState text="Loading equipment..." />
          ) : equipmentOptions.length === 0 ? (
            <NoResults message="No equipment found" />
          ) : (
            <ScrollView style={{ maxHeight: 400 }}>
              <ClickableList
                items={equipmentOptions.map((eq: any) => ({
                  id: eq.id,
                  label: eq.name,
                  onPress: () => {
                    setEquipment({ id: eq.id, name: eq.name });
                    setEquipmentModal(false);
                  },
                }))}
              />
            </ScrollView>
          )}
          <Button text="Close" onPress={() => setEquipmentModal(false)} />
        </View>
      </ModalWrapper>

      <ModalWrapper
        visible={!!rejecting}
        onClose={() => {
          setRejecting(null);
          setRejectReason('');
        }}
      >
        <Title text="Reject Suggestion" />
        <TextInput
          placeholder="Reason (optional)"
          value={rejectReason}
          onChangeText={setRejectReason}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 6,
            padding: 8,
            minWidth: 200,
            marginBottom: spacing.md,
          }}
        />
        <ButtonRow>
          <Button
            text="Cancel"
            onPress={() => {
              setRejecting(null);
              setRejectReason('');
            }}
          />
          <Button text="Reject" onPress={handleReject} />
        </ButtonRow>
      </ModalWrapper>
    </ScreenLayout>
  );
};

export default GlobalCurationScreen;
