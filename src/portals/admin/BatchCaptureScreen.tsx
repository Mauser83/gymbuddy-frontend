import React, {useEffect, useState} from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import ScreenLayout from 'shared/components/ScreenLayout';
import Card from 'shared/components/Card';
import Title from 'shared/components/Title';
import Button from 'shared/components/Button';
import FormInput from 'shared/components/FormInput';
import LoadingState from 'shared/components/LoadingState';
import ModalWrapper from 'shared/components/ModalWrapper';
import SelectableField from 'shared/components/SelectableField';
import {Picker} from '@react-native-picker/picker';

import GymPickerModal, {
  Gym,
} from 'features/workout-sessions/components/GymPickerModal';
import EquipmentPickerModal from 'features/gyms/components/EquipmentPickerModal';
import {Equipment} from 'features/equipment/types/equipment.types';

import {
  useCreateUploadSession,
  useFinalizeGymImages,
  useImageUrlMany,
  useApplyTaxonomiesToGymImages,
} from 'features/cv/hooks/useUploadSession';

type TileState =
  | 'EMPTY'
  | 'PUTTING'
  | 'PUT_ERROR'
  | 'FINALIZED'
  | 'URL_OK'
  | 'URL_EXPIRED';

interface PutItem {
  url: string;
  storageKey: string;
  requiredHeaders?: {key: string; value: string}[];
}

interface UploadTile extends PutItem {
  file?: File;
  putProgress: number;
  state: TileState;
  imageId?: string;
  signedUrl?: string;
  expiresAt?: string;
  angleId?: number;
}

interface FinalizedImage {
  storageKey: string;
  imageId?: string;
  id?: string;
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
      xhr.setRequestHeader(h.key, h.value),
    );
    if (
      !(item.requiredHeaders || []).some(
        h => h.key.toLowerCase() === 'content-type',
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

const initialForm = {
  gymId: '',
  equipmentId: '',
  count: '5',
  filenamePrefix: '',
};

const BatchCaptureScreen = () => {
  const [form, setForm] = useState(initialForm);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [selectedEquipment, setSelectedEquipment] =
    useState<Equipment | null>(null);
  const [gymModalVisible, setGymModalVisible] = useState(false);
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tiles, setTiles] = useState<UploadTile[]>([]);
  const [screenState, setScreenState] = useState(
    'IDLE' as
      | 'IDLE'
      | 'SESSION_READY'
      | 'PUTTING'
      | 'FINALIZING'
      | 'PREVIEW'
      | 'TAGGING',
  );

  const [createSession, {loading: creating}] = useCreateUploadSession();
  const [finalize, {loading: finalizing}] = useFinalizeGymImages();
  const {refresh, patchUrls, data: urlData, loading: urlLoading} =
    useImageUrlMany();
  const [applyTaxonomies] = useApplyTaxonomiesToGymImages();

  // Handle imageUrlMany responses
  useEffect(() => {
    if (urlData?.imageUrlMany) {
      setTiles(prev => patchUrls(prev, urlData.imageUrlMany));
    }
  }, [urlData, patchUrls]);

  const handleStart = async () => {
    const count = Number(form.count);
    const gymId = Number(form.gymId);
    const equipmentId = Number(form.equipmentId);
    if (!gymId || !equipmentId || isNaN(count)) return;
    try {
      const res = await createSession({
        variables: {
          input: {
            gymId,
            count,
            contentTypes: ['image/*'],
            filenamePrefix: form.filenamePrefix || undefined,
            equipmentId,
          },
        },
      });
      const session = res.data.createUploadSession;
      setSessionId(session.sessionId);
      setTiles(
        session.items.map((i: PutItem) => ({
          ...i,
          putProgress: 0,
          state: 'EMPTY' as TileState,
        })),
      );
      setScreenState('SESSION_READY');
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (index: number, file?: File) => {
    setTiles(prev => {
      const copy = [...prev];
      copy[index] = {...copy[index], file};
      return copy;
    });
    if (file) uploadTile(index, file);
  };

  const uploadTile = async (index: number, file: File) => {
    const tile = tiles[index];
    setTiles(prev => {
      const copy = [...prev];
      copy[index] = {...copy[index], state: 'PUTTING', putProgress: 0};
      return copy;
    });
    try {
      await putWithProgress(file, tile, p => {
        setTiles(prev => {
          const copy = [...prev];
          copy[index] = {...copy[index], putProgress: p};
          return copy;
        });
      });
      setTiles(prev => {
        const copy = [...prev];
        copy[index] = {...copy[index], putProgress: 100};
        return copy;
      });
    } catch (err) {
      console.error(err);
      setTiles(prev => {
        const copy = [...prev];
        copy[index] = {...copy[index], state: 'PUT_ERROR'};
        return copy;
      });
    }
  };

  const handleFinalize = async () => {
    if (!sessionId) return;
    const gymId = Number(form.gymId);
    const equipmentId = Number(form.equipmentId);
    setScreenState('FINALIZING');
    try {
      const res = await finalize({
        variables: {
          input: {
            sessionId,
            defaults: {
              gymId,
              equipmentId,
            },
            items: tiles.map(t => ({storageKey: t.storageKey})),
          },
        },
      });
      const images: FinalizedImage[] = res.data.finalizeGymImages.images;
      const map = new Map<string, FinalizedImage>(
        images.map(i => [i.storageKey, i]),
      );
      setTiles(prev =>
        prev.map(t => {
          const found = map.get(t.storageKey);
          return found
            ? {
                ...t,
                imageId: found.imageId || found.id,
                state: 'FINALIZED',
              }
            : t;
        }),
      );
      setScreenState('PREVIEW');
      refresh(tiles.map(t => t.storageKey));
    } catch (err) {
      console.error(err);
      setScreenState('SESSION_READY');
    }
  };

  const handleAngle = async (tile: UploadTile, angleId: number) => {
    if (!tile.imageId) return;
    try {
      await applyTaxonomies({
        variables: {input: {imageIds: [tile.imageId], angleId}},
      });
      setTiles(prev =>
        prev.map(t =>
          t.storageKey === tile.storageKey ? {...t, angleId} : t,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const renderSessionForm = () => (
    <View style={styles.formContainer}>
      <SelectableField
        label="Gym"
        value={selectedGym ? selectedGym.name : 'Select Gym'}
        onPress={() => setGymModalVisible(true)}
      />
      <SelectableField
        label="Equipment"
        value={
          selectedEquipment ? selectedEquipment.name : 'Select Equipment'
        }
        onPress={() => setEquipmentModalVisible(true)}
        disabled={!selectedGym}
      />
      <FormInput
        label="Count"
        value={form.count}
        keyboardType="numeric"
        onChangeText={v => setForm({...form, count: v})}
      />
      <FormInput
        label="Filename Prefix"
        value={form.filenamePrefix}
        onChangeText={v => setForm({...form, filenamePrefix: v})}
      />
      <Button text="Start Session" onPress={handleStart} disabled={creating} />
    </View>
  );

  const renderUploadGrid = () => (
    <View style={styles.grid}>
      {tiles.map((tile, idx) => (
        <View key={tile.storageKey} style={styles.tile}>
          <input
            type="file"
            accept="image/*"
            onChange={e =>
              handleFileChange(idx, (e.target as any)?.files?.[0] as any)
            }
          />
          <Text>Progress: {tile.putProgress}%</Text>
          {tile.state === 'PUT_ERROR' && <Text style={styles.error}>Error</Text>}
        </View>
      ))}
      {tiles.length > 0 && (
        <Button text="Finalize" onPress={handleFinalize} disabled={finalizing} />
      )}
    </View>
  );

  const renderPreviewGrid = () => (
    <View style={styles.grid}>
      {tiles.map(tile => (
        <View key={tile.storageKey} style={styles.tile}>
          {tile.signedUrl ? (
            <Image
              source={{uri: tile.signedUrl}}
              style={{width: 100, height: 100}}
            />
          ) : (
            <LoadingState size="small" />
          )}
          <Picker
            selectedValue={tile.angleId}
            onValueChange={val => handleAngle(tile, Number(val))}
            style={{height: 40, width: 120}}>
            <Picker.Item label="Angle" value={undefined} />
            <Picker.Item label="Front" value={1} />
            <Picker.Item label="Side" value={2} />
            <Picker.Item label="Back" value={3} />
          </Picker>
        </View>
      ))}
    </View>
  );

  return (
    <ScreenLayout scroll>
      <Card variant="glass">
        <Title
          text="Batch Capture"
          subtitle="Capture equipment images in bulk"
        />
        {screenState === 'IDLE' && renderSessionForm()}
        {screenState === 'SESSION_READY' && renderUploadGrid()}
        {screenState === 'FINALIZING' && <LoadingState />}
        {screenState === 'PREVIEW' && renderPreviewGrid()}
        {urlLoading && <LoadingState />}
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
              setForm(prev => ({...prev, gymId: String(gym.id), equipmentId: ''}));
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

const styles = StyleSheet.create({
  formContainer: {
    gap: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  tile: {
    width: 120,
    alignItems: 'center',
    gap: 4,
  },
  error: {
    color: 'red',
  },
});

export default BatchCaptureScreen;
