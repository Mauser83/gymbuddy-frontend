import React, {useState, useMemo, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  Modal,
  Switch,
  StyleSheet,
  Platform,
} from 'react-native';
import ScreenLayout from 'shared/components/ScreenLayout';
import Button from 'shared/components/Button';
import LoadingState from 'shared/components/LoadingState';
import SelectableField from 'shared/components/SelectableField';
import ModalWrapper from 'shared/components/ModalWrapper';
import {useTheme} from 'shared/theme/ThemeProvider';
import {useAuth} from 'features/auth/context/AuthContext';
import {useCandidateImages} from 'features/cv/hooks/useCandidateImages';
import {useImageUrls} from 'features/cv/hooks/useImageUrls';
import {useApproveGymImage} from 'features/cv/hooks/useApproveGymImage';
import {useRejectGymImage} from 'features/cv/hooks/useRejectGymImage';
import {usePromoteGymImageToGlobal} from 'features/cv/hooks/usePromoteGymImageToGlobal';
import GymPickerModal, {
  Gym,
} from 'features/workout-sessions/components/GymPickerModal';
import EquipmentPickerModal from 'features/gyms/components/EquipmentPickerModal';
import {Equipment} from 'features/equipment/types/equipment.types';
import NoResults from 'shared/components/NoResults';

const STATUS_OPTIONS = ['CANDIDATE', 'APPROVED', 'REJECTED'] as const;
const SAFETY_OPTIONS = ['ALL', 'PENDING', 'COMPLETE', 'FAILED'] as const;

const isCandidateLike = (s: string) =>
  s === 'PENDING' || s === 'PROCESSING' || s === 'CANDIDATE';

type Row = {
  id: string;
  gymId?: number | string;
  gymName?: string;
  equipmentId?: number | string;
  storageKey: string;
  sha256: string;
  status: string;
  createdAt?: string;
  tags?: {angleId?: number; splitId?: number; sourceId?: number};
  safety?: {
    state?: 'PENDING' | 'COMPLETE' | 'FAILED';
    score?: number | null;
    reasons?: string[];
  };
  dupCount?: number;
};

const Chip = ({
  text,
  tone = 'default',
}: {
  text: string;
  tone?: 'default' | 'success' | 'warning';
}) => {
  const {theme} = useTheme();
  const colorMap: Record<string, string> = {
    success: (theme.colors as any).success ?? '#22c55e',
    warning: (theme.colors as any).warning ?? '#eab308',
    default: '#666',
  };
  const bg = colorMap[tone] ?? colorMap.default;
  return (
    <View
      style={{
        backgroundColor: bg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
      }}>
      <Text style={{color: '#fff', fontSize: 12}}>{text}</Text>
    </View>
  );
};

const ImageManagementScreen = () => {
  const {theme} = useTheme();
  const {user} = useAuth();
  const appRole = user?.appRole;
  const isAdmin = appRole === 'ADMIN';

  const [equipmentId, setEquipmentId] = useState('');
  const [gymId, setGymId] = useState('');
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null,
  );
  const [gymModalVisible, setGymModalVisible] = useState(false);
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const [status, setStatus] =
    useState<(typeof STATUS_OPTIONS)[number]>('CANDIDATE');
  const [safety, setSafety] = useState<(typeof SAFETY_OPTIONS)[number]>('ALL');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(50);

  const [selected, setSelected] = useState<Row | null>(null);
  const [rejecting, setRejecting] = useState<Row | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [forceApprove, setForceApprove] = useState(false);
  const [errored, setErrored] = useState<Set<string>>(new Set());

  const filters = useMemo(
    () => ({
      equipmentId,
      gymId: gymId || undefined,
      status,
      search: search || undefined,
      limit,
      safety:
        safety === 'ALL'
          ? undefined
          : {state: safety, flaggedOnly: flaggedOnly || undefined},
    }),
    [equipmentId, gymId, status, search, limit, safety, flaggedOnly],
  );

  const {data, loading, error, refetch} = useCandidateImages(filters);
  const rowsRaw: Row[] = useMemo(
    () => data?.candidateGlobalImages ?? [],
    [data],
  );
  const rows: Row[] = useMemo(
    () =>
      rowsRaw.filter(r =>
        status === 'CANDIDATE' ? isCandidateLike(r.status) : r.status === status,
      ),
    [rowsRaw, status],
  );
  const storageKeys = useMemo(() => rows.map(r => r.storageKey), [rows]);
  const {urlByKey, refresh} = useImageUrls(storageKeys, 600);

  useEffect(() => {
    setErrored(prev => {
      const next = new Set(prev);
      storageKeys.forEach(k => {
        if (urlByKey.get(k)) next.delete(k);
      });
      return next;
    });
  }, [urlByKey, storageKeys]);

  const {mutate: approveMutate} = useApproveGymImage();
  const {mutate: rejectMutate} = useRejectGymImage();
  const {mutate: promoteMutate} = usePromoteGymImageToGlobal();

  const handleThumbError = useCallback(
    (key: string) => {
      setErrored(prev => new Set(prev).add(key));
      refresh([key]);
    },
    [refresh],
  );

  const canApprove = useCallback(
    (r: Row) => (isAdmin && forceApprove) || r.safety?.state === 'COMPLETE',
    [isAdmin, forceApprove],
  );

  const handleApprove = useCallback(
    async (r: Row) => {
      try {
        await approveMutate({variables: {id: r.id}});
        setSelected(null);
        refetch();
      } catch (e) {
        console.error(e);
      }
    },
    [approveMutate, refetch],
  );

  const handlePromote = useCallback(
    async (r: Row) => {
      try {
        await promoteMutate({
          variables: {
            id: r.id,
            force: isAdmin && forceApprove ? true : undefined,
          },
        });
        setSelected(null);
        refetch();
      } catch (e) {
        console.error(e);
      }
    },
    [promoteMutate, refetch, isAdmin, forceApprove],
  );

  const handleReject = useCallback((r: Row) => {
    setRejectReason('');
    setRejecting(r);
  }, []);

  const handleRejectConfirm = useCallback(async () => {
    if (!rejecting) return;
    try {
      await rejectMutate({
        variables: {id: rejecting.id, reason: rejectReason || undefined},
      });
      setRejecting(null);
      setSelected(null);
      refetch();
    } catch (e) {
      console.error(e);
    }
  }, [rejectMutate, rejecting, rejectReason, refetch]);

  const renderRow = useCallback(
    ({item}: {item: Row}) => {
      const url = urlByKey.get(item.storageKey);
      const isErrored = errored.has(item.storageKey);
      return (
        <Pressable onPress={() => setSelected(item)}>
          <View style={styles.row}>
            {/* LEFT SIDE: thumbnail + chips above text */}
            <View style={styles.leftCol}>
              <View style={styles.thumbRow}>
                <View style={styles.thumbCol}>
                  {url ? (
                    <Image
                      source={{uri: url}}
                      style={styles.thumb}
                      onError={() => handleThumbError(item.storageKey)}
                    />
                  ) : (
                    <View style={[styles.thumb, {backgroundColor: '#333'}]} />
                  )}
                  {isErrored && (
                    <Pressable
                      style={styles.retryOverlay}
                      onPress={() => handleThumbError(item.storageKey)}>
                      <Text style={styles.retryText}>↻</Text>
                    </Pressable>
                  )}
                </View>
                <View style={styles.chipsCol}>
                  <Chip text={isCandidateLike(item.status) ? 'CANDIDATE' : item.status} />
                  <Chip
                    text={item.safety?.state ?? 'UNKNOWN'}
                    tone={
                      item.safety?.state === 'COMPLETE'
                        ? 'success'
                        : item.safety?.state === 'FAILED'
                        ? 'warning'
                        : 'default'
                    }
                  />
                  {typeof item.safety?.score === 'number' && (
                    <Chip text={`score ${item.safety.score.toFixed(2)}`} />
                  )}
                  {!!item.dupCount && item.dupCount > 0 && (
                    <Chip text={`dup×${item.dupCount}`} />
                  )}
                </View>
              </View>
              <View style={styles.bottomLeft}>
                <Text
                  style={[styles.idText, {color: theme.colors.textPrimary}]}
                  numberOfLines={1}
                  ellipsizeMode="middle">
                  {item.id}
                </Text>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="middle"
                  style={[styles.shaText, {color: theme.colors.textPrimary}]}
                >
                  sha256 {item.sha256}
                </Text>
                {!!item.gymName && (
                  <Text
                    style={[styles.metaText, {color: theme.colors.textPrimary}]}
                    numberOfLines={1}>
                    {item.gymName}
                    {item.createdAt ? ` • ${item.createdAt}` : ''}
                  </Text>
                )}
                {!!item.tags && (
                  <Text
                    style={[styles.metaText, {color: theme.colors.textPrimary}]}
                    numberOfLines={1}>
                    {[
                      item.tags.angleId && `angle:${item.tags.angleId}`,
                      item.tags.splitId && `split:${item.tags.splitId}`,
                      item.tags.sourceId && `src:${item.tags.sourceId}`,
                    ]
                      .filter(Boolean)
                      .join('  ')}
                  </Text>
                )}
              </View>
            </View>

            {/* RIGHT: vertical buttons */}
            <View style={styles.buttonCol}>
              <Button
                text="Approve"
                small
                disabled={!canApprove(item)}
                onPress={() => handleApprove(item)}
              />
              <Button
                text="Reject"
                small
                onPress={() => handleReject(item)}
              />
              <Button
                text="Promote"
                small
                onPress={() => handlePromote(item)}
              />
            </View>
          </View>
        </Pressable>
      );
    },
    [
      urlByKey,
      errored,
      handleThumbError,
      canApprove,
      handleApprove,
      handleReject,
      handlePromote,
    ],
  );

  const list = (
    <FlatList
      data={rows}
      keyExtractor={r => r.id}
      renderItem={renderRow}
      windowSize={7}
      initialNumToRender={12}
      removeClippedSubviews
      // getItemLayout removed: variable row height
    />
  );

  const toolbar = (
    <View style={styles.toolbar}>
      <SelectableField
        label="Gym"
        value={selectedGym ? selectedGym.name : 'Select Gym'}
        onPress={() => setGymModalVisible(true)}
      />
      <SelectableField
        label="Equipment"
        value={selectedEquipment ? selectedEquipment.name : 'Select Equipment'}
        onPress={() => setEquipmentModalVisible(true)}
        disabled={!selectedGym}
      />
      <TextInput
        placeholder="Search"
        value={search}
        onChangeText={setSearch}
        style={[styles.input, {color: theme.colors.textPrimary}]}
      />
      <View style={styles.segmentRow}>
        {STATUS_OPTIONS.map(s => (
          <Pressable
            key={s}
            onPress={() => setStatus(s)}
            style={[styles.segment, status === s && styles.segmentActive]}>
            <Text
              style={{
                color: status === s ? '#fff' : theme.colors.textPrimary,
                fontSize: 12,
              }}>
              {s}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.segmentRow}>
        {SAFETY_OPTIONS.map(s => (
          <Pressable
            key={s}
            onPress={() => setSafety(s)}
            style={[styles.segment, safety === s && styles.segmentActive]}>
            <Text
              style={{
                color: safety === s ? '#fff' : theme.colors.textPrimary,
                fontSize: 12,
              }}>
              {s}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.flagRow}>
        <Text
          style={{
            color: theme.colors.textPrimary,
            fontSize: 12,
            marginRight: 6,
          }}>
          Flagged only
        </Text>
        <Switch value={flaggedOnly} onValueChange={setFlaggedOnly} />
      </View>
      <Button text="Apply" small onPress={() => refetch()} />
      {loading && <ActivityIndicator style={{marginLeft: 8}} />}
    </View>
  );

  return (
    <ScreenLayout>
      {toolbar}
      {loading && rows.length === 0 ? (
        <LoadingState text="Loading images..." />
      ) : error ? (
        <View style={styles.errorBanner}>
          <Text style={{color: '#fff', flex: 1}}>Error loading images</Text>
          <Button text="Retry" small onPress={() => refetch()} />
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.empty}>
          <NoResults message="No results. Adjust filters." />
        </View>
      ) : (
        list
      )}

      {selected && (
        <Modal
          visible
          transparent
          animationType="slide"
          onRequestClose={() => setSelected(null)}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                {backgroundColor: theme.colors.surface},
              ]}>
              <Image
                source={{uri: urlByKey.get(selected.storageKey)}}
                style={styles.detailImage}
                onError={() => handleThumbError(selected.storageKey)}
              />
              <Text style={[styles.modalText, {color: theme.colors.textPrimary}]}>id: {selected.id}</Text>
              <Text style={[styles.modalText, {color: theme.colors.textPrimary}]}>sha256: {selected.sha256}</Text>
              <Text style={[styles.modalText, {color: theme.colors.textPrimary}]}>
                safety: {selected.safety?.state ?? 'UNKNOWN'}
              </Text>
              {isAdmin && (
                <View style={styles.forceRow}>
                  <Text style={[styles.modalText, {color: theme.colors.accentStart}]}>Force Approve</Text>
                  <Switch
                    value={forceApprove}
                    onValueChange={setForceApprove}
                  />
                </View>
              )}
              <View style={styles.modalButtons}>
                <Button
                  text="Approve"
                  small
                  disabled={!canApprove(selected)}
                  onPress={() => handleApprove(selected)}
                />
                <Button
                  text="Reject"
                  small
                  onPress={() => handleReject(selected)}
                />
                <Button
                  text="Promote"
                  small
                  onPress={() => handlePromote(selected)}
                />
              </View>
              <Button
                text="Close"
                small
                onPress={() => setSelected(null)}
              />
            </View>
          </View>
        </Modal>
      )}

      {rejecting && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setRejecting(null)}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.rejectContent,
                {backgroundColor: theme.colors.surface},
              ]}>
              <Text style={styles.modalTitle}>Reject Reason</Text>
              <TextInput
                style={[styles.textArea, {color: theme.colors.textPrimary}]}
                multiline
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="Reason"
              />
              <View style={styles.presetsRow}>
                {['blurry', 'not equipment', 'duplicate'].map(r => (
                  <Pressable
                    key={r}
                    onPress={() => setRejectReason(r)}
                    style={[styles.segment, styles.presetChip]}>
                    <Text style={{color: '#fff', fontSize: 12}}>{r}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.modalButtons}>
                <Button text="Reject" small onPress={handleRejectConfirm} />
                <Button
                  text="Cancel"
                  small
                  variant="outline"
                  onPress={() => setRejecting(null)}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
      <ModalWrapper
        visible={gymModalVisible || equipmentModalVisible}
        onClose={() => {
          setGymModalVisible(false);
          setEquipmentModalVisible(false);
        }}>
        {gymModalVisible && (
          <GymPickerModal
            onClose={() => setGymModalVisible(false)}
            onSelect={gym => {
              setSelectedGym(gym);
              setGymId(String(gym.id));
              setSelectedEquipment(null);
              setEquipmentId('');
              setGymModalVisible(false);
            }}
          />
        )}
        {equipmentModalVisible && selectedGym && (
          <EquipmentPickerModal
            gymId={selectedGym.id}
            onClose={() => setEquipmentModalVisible(false)}
            onSelect={eq => {
              setSelectedEquipment(eq);
              setEquipmentId(String(eq.id));
              setEquipmentModalVisible(false);
            }}
          />
        )}
      </ModalWrapper>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#666',
  },
  segmentActive: {
    backgroundColor: '#666',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    minHeight: 120,
  },
  leftCol: {
    width: Platform.OS === 'web' ? 240 : 200,
    marginRight: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  thumbRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  thumbCol: {
    alignItems: 'flex-start',
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  retryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  retryText: {color: '#fff', fontSize: 18},
  bottomLeft: {
    marginTop: 8,
    width: '100%',
    alignItems: 'flex-start',
  },
  idText: {
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Menlo',
    fontSize: 12,
  },
  shaText: {fontSize: 12},
  chipsCol: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginLeft: 8,
    gap: 6,
  },
  buttonCol: {
    flexDirection: 'column',
    gap: 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: 120,
    flexShrink: 0,
    marginLeft: 'auto',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#b91c1c',
    borderRadius: 6,
  },
  empty: {alignItems: 'center', marginTop: 40},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
  },
  detailImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalText: {marginBottom: 4},
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: 12,
  },
  forceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  rejectContent: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {fontSize: 16, fontWeight: '600', marginBottom: 8},
  textArea: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    minHeight: 80,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginVertical: 8,
  },
  presetChip: {backgroundColor: '#666'},
  flagRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  metaText: {fontSize: 11, opacity: 0.85, marginTop: 2},
});

export default ImageManagementScreen;
