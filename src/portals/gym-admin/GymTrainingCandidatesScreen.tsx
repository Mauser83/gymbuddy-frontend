import React, {useState} from 'react';
import {Image, Text, TextInput, View} from 'react-native';
import {useParams} from 'react-router-native';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import Card from 'shared/components/Card';
import Button from 'shared/components/Button';
import ButtonRow from 'shared/components/ButtonRow';
import ModalWrapper from 'shared/components/ModalWrapper';
import LoadingState from 'shared/components/LoadingState';
import NoResults from 'shared/components/NoResults';
import {useTrainingCandidates} from 'features/cv/hooks/useTrainingCandidates';
import {TrainingCandidateRow} from 'features/cv/graphql/trainingCandidates.graphql';
import {useApproveTrainingCandidate} from 'features/cv/hooks/useApproveTrainingCandidate';
import {useRejectTrainingCandidate} from 'features/cv/hooks/useRejectTrainingCandidate';

export default function GymTrainingCandidatesScreen() {
  const {gymId} = useParams<{gymId: string}>();
  const {data, loading, refetch} = useTrainingCandidates({
    gymId: Number(gymId),
    status: 'PENDING',
    limit: 50,
  });

  const {mutate: approve, loading: approving} = useApproveTrainingCandidate();
  const {mutate: reject, loading: rejecting} = useRejectTrainingCandidate();

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const candidates: TrainingCandidateRow[] = data?.listTrainingCandidates.items ?? [];

  const handleApprove = async (id: string) => {
    await approve({variables: {input: {id}}});
    refetch();
  };

  const handleReject = async () => {
    if (!rejectId) return;
    await reject({variables: {input: {id: rejectId, reason}}});
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
          <Card key={c.id} style={{marginBottom: 16}}>
            <View style={{marginBottom: 8}}>
              <Image
                source={{uri: c.url}}
                style={{width: '100%', height: 200, borderRadius: 8}}
              />
            </View>
            <Title text={c.equipmentName || 'Unknown equipment'} align="left" />
            {c.safetyReasons?.length ? (
              <Text style={{color: 'red', marginBottom: 8}}>
                {c.safetyReasons.join(', ')}
              </Text>
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