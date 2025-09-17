import React, { useState } from 'react';
import { Image, Text, TextInput, View } from 'react-native';
import { useParams } from 'react-router-native';

import { TrainingCandidateRow } from 'src/features/cv/graphql/trainingCandidates.graphql';
import { useApproveTrainingCandidate } from 'src/features/cv/hooks/useApproveTrainingCandidate';
import { useRejectTrainingCandidate } from 'src/features/cv/hooks/useRejectTrainingCandidate';
import { useTrainingCandidates } from 'src/features/cv/hooks/useTrainingCandidates';
import Button from 'src/shared/components/Button';
import ButtonRow from 'src/shared/components/ButtonRow';
import Card from 'src/shared/components/Card';
import LoadingState from 'src/shared/components/LoadingState';
import ModalWrapper from 'src/shared/components/ModalWrapper';
import NoResults from 'src/shared/components/NoResults';
import ScreenLayout from 'src/shared/components/ScreenLayout';
import Title from 'src/shared/components/Title';

export default function GymTrainingCandidatesScreen() {
  const { gymId } = useParams<{ gymId: string }>();
  const { data, loading, refetch } = useTrainingCandidates({
    gymId: Number(gymId),
    status: 'PENDING',
    limit: 50,
  });

  const { mutate: approve, loading: approving } = useApproveTrainingCandidate();
  const { mutate: reject, loading: rejecting } = useRejectTrainingCandidate();

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const candidates: TrainingCandidateRow[] = data?.listTrainingCandidates.items ?? [];

  const handleApprove = async (id: string) => {
    await approve({ variables: { input: { id } } });
    refetch();
  };

  const handleReject = async () => {
    if (!rejectId) return;
    await reject({ variables: { input: { id: rejectId, reason } } });
    setRejectId(null);
    setReason('');
    refetch();
  };

  return (
    <ScreenLayout scroll>
      <Title text="Training Candidates" align="left" />
      {loading ? (
        <LoadingState text="Loading candidates..." />
      ) : candidates.length === 0 ? (
        <NoResults message="No candidates found." />
      ) : (
        candidates.map((c: TrainingCandidateRow) => (
          <Card key={c.id} style={{ marginBottom: 16 }}>
            <View style={{ marginBottom: 8 }}>
              <Image
                source={{ uri: c.url }}
                style={{ width: '100%', height: 200, borderRadius: 8 }}
              />
            </View>
            <Title text={c.equipmentName || 'Unknown equipment'} align="left" />
            {c.safetyReasons?.length ? (
              <Text style={{ color: 'red', marginBottom: 8 }}>{c.safetyReasons.join(', ')}</Text>
            ) : null}
            <ButtonRow>
              <Button
                text="Approve"
                onPress={() => handleApprove(c.id)}
                disabled={approving}
                fullWidth
              />
              <Button
                text="Reject"
                onPress={() => setRejectId(c.id)}
                disabled={rejecting}
                fullWidth
              />
            </ButtonRow>
          </Card>
        ))
      )}

      <ModalWrapper visible={!!rejectId} onClose={() => setRejectId(null)}>
        <Title text="Reject Candidate" align="left" />
        <TextInput
          placeholder="Reason (optional)"
          value={reason}
          onChangeText={setReason}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 8,
            marginBottom: 16,
            width: 250,
          }}
        />
        <ButtonRow>
          <Button text="Cancel" onPress={() => setRejectId(null)} fullWidth />
          <Button
            text={rejecting ? 'Rejecting...' : 'Reject'}
            onPress={handleReject}
            disabled={rejecting}
            fullWidth
          />
        </ButtonRow>
      </ModalWrapper>
    </ScreenLayout>
  );
}
