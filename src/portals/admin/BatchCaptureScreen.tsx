import React, {useState} from 'react';
import {View, Text, Image, Pressable, StyleSheet, Platform} from 'react-native';
import Toast from 'react-native-toast-message';
import ScreenLayout from 'shared/components/ScreenLayout';
import Card from 'shared/components/Card';
import Title from 'shared/components/Title';
import Button from 'shared/components/Button';
import LoadingState from 'shared/components/LoadingState';
import ModalWrapper from 'shared/components/ModalWrapper';
import SelectableField from 'shared/components/SelectableField';
import * as ImagePicker from 'expo-image-picker';
import {useTheme} from 'shared/theme/ThemeProvider';
import {spacing} from 'shared/theme/tokens';

import GymPickerModal, {
  Gym,
} from 'features/workout-sessions/components/GymPickerModal';
import EquipmentPickerModal from 'features/gyms/components/EquipmentPickerModal';
import {Equipment} from 'features/equipment/types/equipment.types';

import {
  useCreateUploadSession,
  useFinalizeGymImages,
} from 'features/cv/hooks/useUploadSession';
type TileState =
  | 'EMPTY'
  | 'PUTTING'
  | 'PUT_ERROR'
  | 'FINALIZED'
  | 'URL_OK'
  | 'URL_EXPIRED'
  | 'REMOVED';

interface PutItem {
  url: string;
  storageKey: string;
  requiredHeaders?: {key?: string; name?: string; value: string}[];
  expiresAt?: string;
}

interface UploadTile {
  storageKey?: string;
  url?: string;
  requiredHeaders?: {key?: string; name?: string; value: string}[];
  file?: File;
  previewUri?: string;
  putProgress: number;
  state: TileState;
  imageId?: string;
  signedUrl?: string;
  expiresAt?: string;
}

// XHR upload helper with progress reporting
function putWithProgress(
  file: File,
  item: PutItem,
  onProgress: (p: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', item.url);
    (item.requiredHeaders || []).forEach(h =>
      xhr.setRequestHeader((h.key ?? h.name)!, h.value),
    );
    if (
      !(item.requiredHeaders || []).some(
        h => (h.key ?? h.name)?.toLowerCase() === 'content-type',
      ) &&
      file.type
    ) {
      xhr.setRequestHeader('Content-Type', file.type);
    }
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`PUT ${xhr.status}`));
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(file);
  });
}

function resolveMimeType(file: File) {
  if (file.type) return file.type;
  const n = (file.name || '').toLowerCase();
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg';
  if (n.endsWith('.png')) return 'image/png';
  if (n.endsWith('.heic')) return 'image/heic';
  if (n.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

const initialForm = {
  gymId: '',
  equipmentId: '',
};

const BatchCaptureScreen = () => {
  const {theme} = useTheme();
  const [form, setForm] = useState(initialForm);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null,
  );
  const [gymModalVisible, setGymModalVisible] = useState(false);
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tiles, setTiles] = useState<UploadTile[]>([]);
  const [uploading, setUploading] = useState(false);

  const [createSession, {loading: preparing}] = useCreateUploadSession();
  const [finalize, {loading: finalizing}] = useFinalizeGymImages();

  // Add images (web)
  const handleAddWeb = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from((e.target as any).files ?? []) as File[];
    if (!files.length) return;
    setTiles(prev => [
      ...prev,
      ...files.map(f => ({
        file: f,
        previewUri: URL.createObjectURL(f),
        putProgress: 0,
        state: 'EMPTY' as const,
      })),
    ]);
  };

  // Add image (native)
  const pickImageNative = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsMultipleSelection: false,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    const blob = await fetch(asset.uri).then(r => r.blob());
    const name = asset.fileName || 'upload.jpg';
    const type = blob.type || 'image/jpeg';
    const file = new File([blob], name, {type});
    setTiles(prev => [
      ...prev,
      {
        file,
        previewUri: asset.uri,
        putProgress: 0,
        state: 'EMPTY' as const,
      },
    ]);
  };

  // Prepare session once files are added
  const prepareSession = async () => {
    const pending = tiles.filter(t => t.state === 'EMPTY' && t.file && !t.url);
    if (!pending.length) return;
    const contentTypes = pending.map(t => resolveMimeType(t.file!));
    const {data} = await createSession({
      variables: {
        input: {
          gymId: Number(form.gymId),
          equipmentId: Number(form.equipmentId),
          count: contentTypes.length,
          contentTypes,
        },
      },
    });
    const session = data.createUploadSession;
    setSessionId(session.sessionId);
    setTiles(prev => {
      const next = [...prev];
      let pi = 0;
      for (let i = 0; i < next.length; i++) {
        if (
          next[i].state === 'EMPTY' &&
          next[i].file &&
          pi < session.items.length &&
          !next[i].url
        ) {
          const item = session.items[pi++];
          next[i] = {
            ...next[i],
            storageKey: item.storageKey,
            url: item.url,
            requiredHeaders: item.requiredHeaders,
            expiresAt: item.expiresAt,
          };
        }
      }
      return next;
    });
  };

  // Upload all pending tiles
  const uploadAll = async () => {
    const pending = tiles
      .map((t, i) => ({t, i}))
      .filter(({t}) => t.url && t.file && t.state === 'EMPTY');
    if (!pending.length) return;
    setUploading(true);
    for (const {t, i} of pending) {
      setTiles(prev => {
        const next = [...prev];
        next[i] = {...next[i], state: 'PUTTING', putProgress: 0};
        return next;
      });
      try {
        await putWithProgress(t.file!, t as PutItem, p => {
          setTiles(prev => {
            const next = [...prev];
            next[i] = {...next[i], putProgress: p};
            return next;
          });
        });
        setTiles(prev => {
          const next = [...prev];
          next[i] = {...next[i], putProgress: 100};
          return next;
        });
      } catch (err) {
        console.error(err);
        setTiles(prev => {
          const next = [...prev];
          next[i] = {...next[i], state: 'PUT_ERROR'};
          return next;
        });
      }
    }
    setUploading(false);
  };

  // Finalize session
  const finalizeSession = async () => {
    if (!sessionId) return;
    const items = tiles
      .filter(
        t => t.state !== 'REMOVED' && (t.state === 'PUTTING' || t.putProgress === 100),
      )
      .map(t => ({storageKey: t.storageKey!}));
    try {
      const res = await finalize({
        variables: {
          input: {
            sessionId,
            defaults: {
              gymId: Number(form.gymId),
              equipmentId: Number(form.equipmentId),
            },
            items,
          },
        },
      });
      const payload = res.data.finalizeGymImages;
      setTiles(prev =>
        prev.map(t =>
          t.state === 'REMOVED' ? t : {...t, state: 'FINALIZED'},
        ),
      );
      Toast.show({
        type: 'success',
        text1: `Queued ${payload.queuedJobs} jobs`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Remove tile with cleanup
  const removeTile = (index: number) => {
    setTiles(prev => {
      const t = prev[index];
      if (!t) return prev;
      if (Platform.OS === 'web' && t.previewUri?.startsWith('blob:')) {
        URL.revokeObjectURL(t.previewUri);
      }
      // If not uploaded yet
      if (!t.storageKey && (t.state === 'EMPTY' || t.state === 'PUT_ERROR')) {
        const next = [...prev];
        next.splice(index, 1);
        return next;
      }
      // If uploaded but not finalized
      if (t.state !== 'FINALIZED') {
        const next = [...prev];
        next[index] = {...t, state: 'REMOVED'};
        return next;
      }
      return prev;
    });
  };

  const tilesToShow = tiles.filter(t => t.state !== 'REMOVED');
  const prepareCount = tiles.filter(t => t.state === 'EMPTY' && !t.url).length;
  const uploadCount = tiles.filter(t => t.state === 'EMPTY' && !!t.url).length;
  const allUploaded =
    tilesToShow.length > 0 && tilesToShow.every(t => t.putProgress === 100);

  return (
    <ScreenLayout scroll>
      <Card variant="glass">
        <Title
          text="Batch Capture"
          subtitle="Capture equipment images in bulk"
        />
        <View style={styles.formContainer}>
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
        </View>
        <View style={{marginTop: spacing.md}}>
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm}}>
            {tiles.map((t, idx) =>
              t.state === 'REMOVED' ? null : (
                <ThumbnailTile
                  key={t.storageKey ?? t.previewUri ?? `idx-${idx}`}
                  tile={t}
                  onRemove={() => removeTile(idx)}
                />
              ),
            )}

            {Platform.OS === 'web' ? (
              <label style={addTileStyle as any}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{display: 'none'}}
                  onChange={handleAddWeb}
                />
                <Text style={{textAlign: 'center'}}>＋ Add image</Text>
              </label>
            ) : (
              <Pressable onPress={pickImageNative} style={addTileStyle as any}>
                <Text style={{textAlign: 'center'}}>＋ Add image</Text>
              </Pressable>
            )}
          </View>
        </View>

        {prepareCount > 0 && (
          <Button
            text={`Prepare ${prepareCount} files`}
            onPress={prepareSession}
            disabled={
              preparing || !Number(form.gymId) || !Number(form.equipmentId)
            }
          />
        )}
        {uploadCount > 0 && (
          <Button
            text={`Upload ${uploadCount} files`}
            onPress={uploadAll}
            disabled={uploading}
          />
        )}
        {allUploaded && (
          <Button
            text="Finalize"
            onPress={finalizeSession}
            disabled={finalizing}
          />
        )}
        {(preparing || uploading || finalizing) && <LoadingState />}
      </Card>
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
              setForm(prev => ({
                ...prev,
                gymId: String(gym.id),
                equipmentId: '',
              }));
              setSelectedEquipment(null);
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
              setForm(prev => ({...prev, equipmentId: String(eq.id)}));
              setEquipmentModalVisible(false);
            }}
          />
        )}
      </ModalWrapper>
    </ScreenLayout>
  );
};

function ThumbnailTile({
  tile,
  onRemove,
}: {
  tile: UploadTile;
  onRemove: () => void;
}) {
  const {theme} = useTheme();
  const size = 120;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
        borderColor: theme.colors.divider,
        backgroundColor: theme.colors.surface,
      }}
    >
      {tile.previewUri ? (
        <Image
          source={{uri: tile.previewUri}}
          style={{width: '100%', height: '100%'}}
          resizeMode="cover"
        />
      ) : (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <Text style={{color: theme.colors.textSecondary, fontSize: 12}}>
            No preview
          </Text>
        </View>
      )}
      {tile.putProgress > 0 && tile.putProgress < 100 && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 4,
            backgroundColor: theme.colors.disabledBorder,
          }}
        >
          <View
            style={{
              width: `${tile.putProgress}%`,
              height: 4,
              backgroundColor: theme.colors.accentStart,
            }}
          />
        </View>
      )}
      {tile.state === 'FINALIZED' && (
        <View
          style={{
            position: 'absolute',
            left: 6,
            bottom: 6,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 9999,
            backgroundColor: theme.colors.disabledSurface,
          }}
        >
          <Text style={{fontSize: 10, color: theme.colors.textPrimary}}>
            Finalized
          </Text>
        </View>
      )}
      <Pressable
        onPress={onRemove}
        accessibilityLabel="Remove image"
        style={{
          position: 'absolute',
          top: 6,
          right: 6,
          width: 22,
          height: 22,
          borderRadius: 11,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.accentStart,
        }}
      >
        <Text style={{color: 'white', fontWeight: '700', lineHeight: 22}}>×</Text>
      </Pressable>
    </View>
  );
}

const addTileStyle = {
  width: 120,
  height: 120,
  borderRadius: 12,
  borderWidth: 1,
  borderStyle: 'dashed' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const styles = StyleSheet.create({
  formContainer: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
});

export default BatchCaptureScreen;
