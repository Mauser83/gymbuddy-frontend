import React, { useState, useMemo, useCallback, useEffect } from 'react';
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

import { useAuth } from 'src/features/auth/context/AuthContext';
import { useApproveGymImage } from 'src/features/cv/hooks/useApproveGymImage';
import { useCandidateImages } from 'src/features/cv/hooks/useCandidateImages';
import { useImageUrls } from 'src/features/cv/hooks/useImageUrls';
import { usePromoteGymImageToGlobal } from 'src/features/cv/hooks/usePromoteGymImageToGlobal';
import { useRejectGymImage } from 'src/features/cv/hooks/useRejectGymImage';
import { useTagNameMaps } from 'src/features/cv/hooks/useTagNameMaps';
import { Equipment } from 'src/features/equipment/types/equipment.types';
import EquipmentPickerModal from 'src/features/gyms/components/EquipmentPickerModal';
import GymPickerModal, { Gym } from 'src/features/workout-sessions/components/GymPickerModal';
import Button from 'src/shared/components/Button';
import LoadingState from 'src/shared/components/LoadingState';
import ModalWrapper from 'src/shared/components/ModalWrapper';
import NoResults from 'src/shared/components/NoResults';
import ScreenLayout from 'src/shared/components/ScreenLayout';
import SelectableField from 'src/shared/components/SelectableField';
import { useTheme } from 'src/shared/theme/ThemeProvider';

const STATUS_OPTIONS = ['CANDIDATE', 'APPROVED', 'REJECTED', 'QUARANTINED'] as const;
const SAFETY_OPTIONS = ['ALL', 'PENDING', 'COMPLETE', 'FAILED'] as const;

const isCandidateLike = (s?: string) => s === 'PENDING'; // UI “CANDIDATE” = DB PENDING

const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleString() : '');

type Row = {
  id: string;
  gymId?: number | string;
  gymName?: string;
  equipmentId?: number | string;
  storageKey: string;
  sha256: string;
  status: string;
  approvedAt?: string;
  approvedBy?: { id: string; username?: string };
  createdAt?: string;
  tags?: {
    angleId?: number;
    heightId?: number;
    distanceId?: number;
    lightingId?: number;
    mirrorId?: number;
    splitId?: number;
    sourceId?: number;
  };
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
  const { theme } = useTheme();
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
      }}
    >
      <Text style={{ color: '#fff', fontSize: 12 }}>{text}</Text>
    </View>
  );
};

const ImageManagementScreen = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const appRole = user?.appRole;
  const isAdmin = appRole === 'ADMIN';

  const [equipmentId, setEquipmentId] = useState('');
  const [gymId, setGymId] = useState('');
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [gymModalVisible, setGymModalVisible] = useState(false);
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>('CANDIDATE');
  const [safety, setSafety] = useState<(typeof SAFETY_OPTIONS)[number]>('ALL');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(50);

  const [selected, setSelected] = useState<Row | null>(null);
  const [rejecting, setRejecting] = useState<Row | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [errored, setErrored] = useState<Set<string>>(new Set());
  const tagNames = useTagNameMaps();
  const getTagName = (
    kind: 'angle' | 'height' | 'distance' | 'lighting' | 'mirror' | 'split' | 'source',
    id?: number,
  ) => (id != null ? tagNames[kind].get(Number(id)) : undefined);

  const filters = useMemo(
    () => ({
      equipmentId,
      gymId: gymId || undefined,
      status,
      search: search || undefined,
      limit,
      safety:
        safety === 'ALL' ? undefined : { state: safety, flaggedOnly: flaggedOnly || undefined },
    }),
    [equipmentId, gymId, status, search, limit, safety, flaggedOnly],
  );

  const { data, loading, error, refetch } = useCandidateImages(filters);
  const rowsRaw: Row[] = useMemo(() => data?.candidateGlobalImages ?? [], [data]);
  const rows: Row[] = useMemo(
    () =>
      rowsRaw.filter((r) =>
        status === 'CANDIDATE' ? isCandidateLike(r.status) : r.status === status,
      ),
    [rowsRaw, status],
  );
  const storageKeys = useMemo(() => rows.map((r) => r.storageKey), [rows]);
  const { urlByKey, refresh } = useImageUrls(storageKeys, 600);

  useEffect(() => {
    setErrored((prev) => {
      const next = new Set(prev);
      storageKeys.forEach((k) => {
        if (urlByKey.get(k)) next.delete(k);
      });
      return next;
    });
  }, [urlByKey, storageKeys]);

  const { mutate: approveMutate } = useApproveGymImage();
  const { mutate: rejectMutate } = useRejectGymImage();
  const { mutate: promoteMutate } = usePromoteGymImageToGlobal();

  const handleThumbError = useCallback(
    (key: string) => {
      setErrored((prev) => new Set(prev).add(key));
      refresh([key]);
    },
    [refresh],
  );

  const canApprove = useCallback(
    (r: Row) => r.status !== 'QUARANTINED' && r.safety?.state === 'COMPLETE',
    [],
  );

  const canPromote = useCallback((r: Row) => r.status === 'APPROVED', []);

  const handleApprove = useCallback(
    async (r: Row, force?: boolean) => {
      try {
        await approveMutate({
          variables: {
            input: {
              id: r.id,
              force: !!force, // will be true when forcing
            },
          },
        });
        setSelected(null);
        refetch();
      } catch (e) {
        console.error(e);
      }
    },
    [approveMutate, refetch],
  );

  const handlePromote = useCallback(
    async (r: Row, force?: boolean) => {
      try {
        await promoteMutate({
          variables: { input: { id: r.id, force: !!force } },
        });
        setSelected(null);
        refetch();
      } catch (e) {
        console.error(e);
      }
    },
    [promoteMutate, refetch],
  );

  const handleReject = useCallback((r: Row) => {
    setRejectReason('');
    setRejecting(r);
  }, []);

  const handleRejectConfirm = useCallback(async () => {
    if (!rejecting) return;
    try {
      await rejectMutate({
        variables: {
          input: { id: rejecting.id, reason: rejectReason || undefined },
        },
      });
      setRejecting(null);
      setSelected(null);
      refetch();
    } catch (e) {
      console.error(e);
    }
  }, [rejectMutate, rejecting, rejectReason, refetch]);

  const renderRow = useCallback(
    ({ item }: { item: Row }) => {
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
                      source={{ uri: url }}
                      style={styles.thumb}
                      onError={() => handleThumbError(item.storageKey)}
                    />
                  ) : (
                    <View style={[styles.thumb, { backgroundColor: '#333' }]} />
                  )}
                  {isErrored && (
                    <Pressable
                      style={styles.retryOverlay}
                      onPress={() => handleThumbError(item.storageKey)}
                    >
                      <Text style={styles.retryText}>↻</Text>
                    </Pressable>
                  )}
                </View>
                <View style={styles.chipsCol}>
                  <Chip
                    text={isCandidateLike(item.status) ? 'CANDIDATE' : item.status}
                    tone={item.status === 'QUARANTINED' ? 'warning' : 'default'}
                  />
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
                  {(item.status === 'QUARANTINED' || item.safety?.state === 'FAILED') &&
                    (item.safety?.reasons ?? []).map((r) => (
                      <Chip key={r} text={r} tone="warning" />
                    ))}
                  {!!item.dupCount && item.dupCount > 0 && <Chip text={`dup×${item.dupCount}`} />}
                </View>
              </View>
              <View style={styles.bottomLeft}>
                {/* tiny id for copy/debug */}
                <Text
                  style={[styles.metaText, { color: theme.colors.textPrimary, opacity: 0.7 }]}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {item.id}
                </Text>

                {/* main meta line */}
                <Text
                  style={[styles.metaText, { color: theme.colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {item.gymName ?? `Gym ${item.gymId}`}
                  {item.createdAt ? ` • ${formatDate(item.createdAt)}` : ''}
                </Text>
              </View>
            </View>

            {/* RIGHT: vertical buttons */}
            <View style={styles.buttonCol}>
              {item.status !== 'QUARANTINED' && (
                <Button
                  text="Approve"
                  small
                  disabled={!canApprove(item)}
                  onPress={() => handleApprove(item)}
                />
              )}
              <Button text="Reject" small onPress={() => handleReject(item)} />
              {item.status !== 'QUARANTINED' && (
                <Button
                  text="Promote"
                  small
                  disabled={!canPromote(item)}
                  onPress={() => handlePromote(item)}
                />
              )}
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
      canPromote,
    ],
  );

  const list = (
    <FlatList
      data={rows}
      keyExtractor={(r) => r.id}
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
        style={[styles.input, { color: theme.colors.textPrimary }]}
      />
      <View style={styles.segmentRow}>
        {STATUS_OPTIONS.map((s) => (
          <Pressable
            key={s}
            onPress={() => setStatus(s)}
            style={[styles.segment, status === s && styles.segmentActive]}
          >
            <Text
              style={{
                color: status === s ? '#fff' : theme.colors.textPrimary,
                fontSize: 12,
              }}
            >
              {s}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.segmentRow}>
        {SAFETY_OPTIONS.map((s) => (
          <Pressable
            key={s}
            onPress={() => setSafety(s)}
            style={[styles.segment, safety === s && styles.segmentActive]}
          >
            <Text
              style={{
                color: safety === s ? '#fff' : theme.colors.textPrimary,
                fontSize: 12,
              }}
            >
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
          }}
        >
          Flagged only
        </Text>
        <Switch value={flaggedOnly} onValueChange={setFlaggedOnly} />
      </View>
      <Button text="Apply" small onPress={() => refetch()} />
      {loading && <ActivityIndicator style={{ marginLeft: 8 }} />}
    </View>
  );

  return (
    <ScreenLayout>
      {toolbar}
      {loading && rows.length === 0 ? (
        <LoadingState text="Loading images..." />
      ) : error ? (
        <View style={styles.errorBanner}>
          <Text style={{ color: '#fff', flex: 1 }}>Error loading images</Text>
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
        <Modal visible transparent animationType="slide" onRequestClose={() => setSelected(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
              <Image
                source={{ uri: urlByKey.get(selected.storageKey) }}
                style={styles.detailImage}
                onError={() => handleThumbError(selected.storageKey)}
              />
              <Text style={[styles.modalText, { color: theme.colors.textPrimary }]}>
                {selected.gymName ?? `Gym ${selected.gymId}`}
                {selected.createdAt ? ` • ${formatDate(selected.createdAt)}` : ''}
              </Text>
              {selected.approvedAt && (
                <Text style={[styles.modalText, { color: theme.colors.textPrimary }]}>
                  Approved by {selected.approvedBy?.username ?? 'Unknown'} on{' '}
                  {formatDate(selected.approvedAt)}
                </Text>
              )}

              {/* Safety */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 8,
                }}
              >
                <Chip
                  text={selected.safety?.state ?? 'UNKNOWN'}
                  tone={
                    ['COMPLETED', 'COMPLETE'].includes((selected.safety?.state as string) || '')
                      ? 'success'
                      : selected.safety?.state === 'FAILED'
                        ? 'warning'
                        : 'default'
                  }
                />
                {typeof selected.safety?.score === 'number' && (
                  <Text style={[styles.modalText, { color: theme.colors.textPrimary }]}>
                    score: {selected.safety.score.toFixed(2)}
                  </Text>
                )}
              </View>
              {!!selected.safety?.reasons?.length && (
                <Text style={[styles.modalText, { color: theme.colors.textPrimary }]}>
                  reasons: {selected.safety.reasons.join(', ')}
                </Text>
              )}

              {/* Duplicates */}
              {!!selected.dupCount && selected.dupCount > 0 && (
                <Text style={[styles.modalText, { color: theme.colors.textPrimary }]}>
                  Possible duplicate (sha match)
                </Text>
              )}
              {!!selected.sha256 && (
                <Button
                  text="Copy SHA"
                  small
                  onPress={() =>
                    (globalThis as any).navigator?.clipboard?.writeText?.(selected.sha256)
                  }
                />
              )}

              {/* Tag names */}
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.modalText, { color: theme.colors.textPrimary }]}>
                  {[
                    getTagName('angle', selected.tags?.angleId) &&
                      `angle: ${getTagName('angle', selected.tags?.angleId)}`,
                    getTagName('height', selected.tags?.heightId) &&
                      `height: ${getTagName('height', selected.tags?.heightId)}`,
                    getTagName('distance', selected.tags?.distanceId) &&
                      `distance: ${getTagName('distance', selected.tags?.distanceId)}`,
                    getTagName('lighting', selected.tags?.lightingId) &&
                      `lighting: ${getTagName('lighting', selected.tags?.lightingId)}`,
                    getTagName('mirror', selected.tags?.mirrorId) &&
                      `mirror: ${getTagName('mirror', selected.tags?.mirrorId)}`,
                    getTagName('split', selected.tags?.splitId) &&
                      `split: ${getTagName('split', selected.tags?.splitId)}`,
                    getTagName('source', selected.tags?.sourceId) &&
                      `source: ${getTagName('source', selected.tags?.sourceId)}`,
                  ]
                    .filter(Boolean)
                    .join('  ')}
                </Text>
              </View>

              {isAdmin &&
                selected.status !== 'QUARANTINED' &&
                selected.safety?.state !== 'COMPLETE' && (
                  <View style={{ marginTop: 8 }}>
                    <Button
                      text="Force Approve"
                      small
                      onPress={() => handleApprove(selected, true)}
                    />
                  </View>
                )}

              {isAdmin &&
                selected.status !== 'QUARANTINED' &&
                selected.safety?.state !== 'COMPLETE' && (
                  <View style={{ marginTop: 8 }}>
                    <Button
                      text="Force Promote"
                      small
                      onPress={() => handlePromote(selected, true)}
                    />
                  </View>
                )}

              <View style={styles.modalButtons}>
                {selected.status !== 'QUARANTINED' && (
                  <Button
                    text="Approve"
                    small
                    disabled={!canApprove(selected)}
                    onPress={() => handleApprove(selected)}
                  />
                )}
                <Button text="Reject" small onPress={() => handleReject(selected)} />
                {selected.status !== 'QUARANTINED' && (
                  <Button
                    text="Promote"
                    small
                    disabled={!canPromote(selected)}
                    onPress={() => handlePromote(selected)}
                  />
                )}
              </View>
              <Button text="Close" small onPress={() => setSelected(null)} />
            </View>
          </View>
        </Modal>
      )}

      {rejecting && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setRejecting(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.rejectContent, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                Reject Reason
              </Text>
              <TextInput
                style={[styles.textArea, { color: theme.colors.textPrimary }]}
                multiline
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="Reason"
              />
              <View style={styles.presetsRow}>
                {['blurry', 'not equipment', 'duplicate'].map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => setRejectReason(r)}
                    style={[styles.segment, styles.presetChip]}
                  >
                    <Text style={{ color: '#fff', fontSize: 12 }}>{r}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.modalButtons}>
                <Button text="Reject" small onPress={handleRejectConfirm} />
                <Button text="Cancel" small onPress={() => setRejecting(null)} />
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
        }}
      >
        {gymModalVisible && (
          <GymPickerModal
            onClose={() => setGymModalVisible(false)}
            onSelect={(gym) => {
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
            onSelect={(ge) => {
              setSelectedEquipment(ge.equipment);
              setEquipmentId(String(ge.equipment.id));
              setEquipmentModalVisible(false);
            }}
          />
        )}
      </ModalWrapper>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  bottomLeft: {
    alignItems: 'flex-start',
    marginTop: 8,
    width: '100%',
  },
  buttonCol: {
    alignItems: 'flex-end',
    flexDirection: 'column',
    flexShrink: 0,
    gap: 8,
    justifyContent: 'center',
    marginLeft: 'auto',
    width: 120,
  },
  chipsCol: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    gap: 6,
    justifyContent: 'flex-start',
    marginLeft: 8,
  },
  detailImage: {
    borderRadius: 8,
    height: 300,
    marginBottom: 12,
    width: '100%',
  },
  empty: { alignItems: 'center', marginTop: 40 },
  errorBanner: {
    alignItems: 'center',
    backgroundColor: '#b91c1c',
    borderRadius: 6,
    flexDirection: 'row',
    padding: 8,
  },
  flagRow: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  forceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  idText: {
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Menlo',
    fontSize: 12,
  },
  input: {
    borderColor: '#ccc',
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 80,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  leftCol: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    marginRight: 12,
    width: Platform.OS === 'web' ? 240 : 200,
  },
  metaText: { fontSize: 11, marginTop: 2, opacity: 0.85 },
  modalButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  modalContent: {
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalText: { marginBottom: 4 },
  modalTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  presetChip: { backgroundColor: '#666' },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginVertical: 8,
  },
  rejectContent: {
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  retryOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  retryText: { color: '#fff', fontSize: 18 },
  row: {
    alignItems: 'flex-start',
    borderBottomColor: '#333',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 120,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  segment: {
    borderColor: '#666',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  segmentActive: {
    backgroundColor: '#666',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 4,
  },
  shaText: { fontSize: 12 },
  textArea: {
    borderColor: '#ccc',
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 80,
    padding: 8,
  },
  thumb: {
    backgroundColor: '#eee',
    borderRadius: 8,
    height: 64,
    width: 64,
  },
  thumbCol: {
    alignItems: 'flex-start',
  },
  thumbRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  toolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
});

export default ImageManagementScreen;
