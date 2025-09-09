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
import OptionItem from 'shared/components/OptionItem';
import * as ImagePicker from 'expo-image-picker';
import {useTheme} from 'shared/theme/ThemeProvider';
import {spacing} from 'shared/theme/tokens';
import {useNavigate} from 'react-router-native';
import {preprocessImage} from 'shared/utils';
import {uploadConfig} from 'config/upload';

import GymPickerModal, {
  Gym,
} from 'features/workout-sessions/components/GymPickerModal';
import EquipmentPickerModal from 'features/gyms/components/EquipmentPickerModal';
import {Equipment} from 'features/equipment/types/equipment.types';

import {
  useCreateAdminUploadTicket,
  useFinalizeGymImagesAdmin,
} from 'features/cv/hooks/useUploadSession';
import {useAuth} from 'features/auth/context/AuthContext';
import {
  useApplyTaxonomies,
  useTaxonomyOptions,
  TaxonomyOption,
} from 'features/cv/hooks/useTagging';
import AccessDenied from 'shared/components/AccessDenied';
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
    xhr.timeout = 120000; // 120s safety
    (item.requiredHeaders || []).forEach(
      (h: {key?: string; name?: string; value: string}) =>
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
    xhr.onloadstart = () => console.log('[PUT] start', item.storageKey);
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 2)
        console.log('[PUT] headers received', xhr.status);
      if (xhr.readyState === 3) console.log('[PUT] loading…');
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`PUT ${xhr.status}`));
    xhr.onerror = () => reject(new Error('Network error (CORS/SSL?)'));
    xhr.ontimeout = () => reject(new Error('PUT timeout (120s)'));
    xhr.onabort = () => reject(new Error('PUT aborted'));
    xhr.send(file);
  });
}

function resolveMimeType(_file: File) {
  return 'image/jpeg';
}

function guessMimeFromName(_name: string) {
  return 'image/jpeg';
}

function extFromMime(_mime: string) {
  return 'jpg';
}

const initialForm = {
  gymId: '',
  equipmentId: '',
};

const BatchCaptureScreen = () => {
  const {theme} = useTheme();
  const navigate = useNavigate();
  const {user} = useAuth();
  const isAdmin = user?.appRole === 'ADMIN' || user?.appRole === 'MODERATOR';
  if (!isAdmin) {
    return (
      <ScreenLayout>
        <AccessDenied />
      </ScreenLayout>
    );
  }
  const [form, setForm] = useState(initialForm);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null,
  );
  const [gymModalVisible, setGymModalVisible] = useState(false);
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const [tiles, setTiles] = useState<UploadTile[]>([]);
  const tilesRef = React.useRef<UploadTile[]>([]);
  type Phase = 'SELECT' | 'PREPARED' | 'UPLOADING' | 'TAGGING';
  const [phase, setPhase] = useState<Phase>('SELECT');
  React.useEffect(() => {
    tilesRef.current = tiles;
  }, [tiles]);
  React.useEffect(() => {
    if (phase !== 'PREPARED') return;
    // Now the presigned URLs are in tiles; start the upload chain.
    (async () => {
      setPhase('UPLOADING');
      await uploadAll();
      await finalizeSession();
    })().catch(err => {
      console.error(err);
      setPhase('PREPARED');
      Toast.show({type: 'error', text1: 'Upload failed'});
    });
  }, [phase]);
  const [uploading, setUploading] = useState(false);

  const [createTicket, {loading: preparing}] = useCreateAdminUploadTicket();
  const [finalize, {loading: finalizing}] = useFinalizeGymImagesAdmin();

  const {data: ang} = useTaxonomyOptions('ANGLE');
  const {data: hgt} = useTaxonomyOptions('HEIGHT');
  const {data: dst} = useTaxonomyOptions('DISTANCE');
  const {data: lgt} = useTaxonomyOptions('LIGHTING');
  const {data: mir} = useTaxonomyOptions('MIRROR');
  const {data: spl} = useTaxonomyOptions('SPLIT');
  const {data: src} = useTaxonomyOptions('SOURCE');
  const angles = (ang?.taxonomyTypes as TaxonomyOption[]) ?? [];
  const heights = (hgt?.taxonomyTypes as TaxonomyOption[]) ?? [];
  const distances = (dst?.taxonomyTypes as TaxonomyOption[]) ?? [];
  const lighting = (lgt?.taxonomyTypes as TaxonomyOption[]) ?? [];
  const mirrors = (mir?.taxonomyTypes as TaxonomyOption[]) ?? [];
  const splits = (spl?.taxonomyTypes as TaxonomyOption[]) ?? [];
  const sources = (src?.taxonomyTypes as TaxonomyOption[]) ?? [];

  const [applyTaxonomies] = useApplyTaxonomies();

  const [defaults, setDefaults] = useState<{
    splitId?: number;
    sourceId?: number;
  }>({});
  const [defaultOpen, setDefaultOpen] = useState<{
    k?: string;
    visible: boolean;
  }>({
    visible: false,
  });
  const openDefault = (k: string) => setDefaultOpen({k, visible: true});
  const closeDefault = () => setDefaultOpen({visible: false});
  const DEFAULT_PICKMAP: Record<
    string,
    {label: string; value?: number; options: TaxonomyOption[]}
  > = {
    split: {label: 'Split', value: defaults.splitId, options: splits},
    source: {label: 'Source', value: defaults.sourceId, options: sources},
  };
  const currentDefault = defaultOpen.k ? DEFAULT_PICKMAP[defaultOpen.k] : null;

  async function applySingle(
    imageId: string | undefined,
    patch: Partial<{
      angleId: number;
      heightId: number;
      distanceId: number;
      lightingId: number;
      mirrorId: number;
    }>,
  ) {
    if (typeof imageId !== 'string' || imageId.length === 0) return;
    await applyTaxonomies({
      variables: {input: {imageIds: [imageId], ...patch}},
    });
  }

  async function applyDefaults() {
    const imageIds = tiles
      .map(t => t.imageId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
    if (!imageIds.length) return;
    const patch: any = {};
    if (defaults.splitId) patch.splitId = defaults.splitId;
    if (defaults.sourceId) patch.sourceId = defaults.sourceId;
    if (!Object.keys(patch).length) return;
    await applyTaxonomies({variables: {input: {imageIds, ...patch}}});
    Toast.show({type: 'success', text1: 'Applied to all'});
  }
  // Add images (web)
  const handleAddWeb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from((e.target as any).files ?? []) as File[];
    if (!files.length) return;
    const newTiles: UploadTile[] = [];
    for (const f of files) {
      const objectUrl = URL.createObjectURL(f);
      try {
        const processed = await preprocessImage(
          objectUrl,
          undefined,
          undefined,
          uploadConfig.gymImage.longSide,
          uploadConfig.gymImage.quality,
        );
        console.log('processed size', processed.size);
        const blob = await fetch(processed.uri).then(r => r.blob());
        const base = f.name.replace(/\.[^/.]+$/, '');
        const file = new File([blob], `${base}.jpg`, {type: 'image/jpeg'});
        newTiles.push({
          file,
          previewUri: processed.uri,
          putProgress: 0,
          state: 'EMPTY' as const,
        });
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    }
    setTiles(prev => [...prev, ...newTiles]);
  };

  // Add images (native)
  const pickImagesNative = async () => {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Media library permission required.',
      });
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 1,
    });
    if (res.canceled || !res.assets?.length) return;
    const newTiles: UploadTile[] = [];
    for (const asset of res.assets) {
      const processed = await preprocessImage(
        asset.uri,
        asset.width,
        asset.height,
        uploadConfig.gymImage.longSide,
        uploadConfig.gymImage.quality,
      );
      console.log('processed size', processed.size);
      const blob = await fetch(processed.uri).then(r => r.blob());
      const base = (asset.fileName || 'upload').replace(/\.[^/.]+$/, '');
      const file = new File([blob], `${base}.jpg`, {type: 'image/jpeg'});
      newTiles.push({
        file,
        previewUri: processed.uri,
        putProgress: 0,
        state: 'EMPTY' as const,
      });
    }
    setTiles(prev => [...prev, ...newTiles]);
  };

  // Prepare session once files are added
  const prepareSession = async () => {
    const pending = tiles
      .map((t, i) => ({t, i}))
      .filter(({t}) => t.state === 'EMPTY' && t.file && !t.url);
    if (!pending.length) return;
    for (const {t, i} of pending) {
      const mime = resolveMimeType(t.file!);
      const ext = extFromMime(mime);
      const {data} = await createTicket({
        variables: {
          input: {
            gymId: Number(form.gymId),
            upload: {
              ext,
              contentType: mime,
              contentLength: t.file!.size,
            },
          },
        },
      });
      const item = data.createAdminUploadTicket;
      setTiles(prev => {
        const next = [...prev];
        next[i] = {
          ...next[i],
          storageKey: item.storageKey,
          url: item.url,
          requiredHeaders: item.requiredHeaders,
          expiresAt: item.expiresAt,
        };
        return next;
      });
    }
    setPhase('PREPARED');
  };

  const refreshTicket = async (index: number) => {
    const t = tilesRef.current[index];
    if (!t.file) return;
    const mime = resolveMimeType(t.file);
    const ext = extFromMime(mime);
    const {data} = await createTicket({
      variables: {
        input: {
          gymId: Number(form.gymId),
          upload: {
            ext,
            contentType: mime,
            contentLength: t.file.size,
          },
        },
      },
    });
    const item = data.createAdminUploadTicket;
    setTiles(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        storageKey: item.storageKey,
        url: item.url,
        requiredHeaders: item.requiredHeaders,
        expiresAt: item.expiresAt,
      };
      return next;
    });
  };

  // Upload all pending tiles
  const uploadAll = async () => {
    const pending = tilesRef.current
      .map((t, i) => ({t, i}))
      .filter(({t}) => t.url && t.file && t.state === 'EMPTY');
    if (!pending.length) {
      const empties = tilesRef.current.filter(
        t => t.file && !t.url && t.state === 'EMPTY',
      );
      if (empties.length) {
        console.warn(
          '[UPLOAD] found EMPTY tiles without presigns; did prepare run?',
        );
      }
      return;
    }
    setUploading(true);
    for (const {t, i} of pending) {
      setTiles(prev => {
        const next = [...prev];
        next[i] = {...next[i], state: 'PUTTING', putProgress: 0};
        return next;
      });
      const attemptUpload = async () => {
        const current = tilesRef.current[i];
        if (
          current.expiresAt &&
          new Date(current.expiresAt).getTime() <= Date.now()
        ) {
          await refreshTicket(i);
        }
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const curr = tilesRef.current[i];
            await putWithProgress(curr.file!, curr as PutItem, p => {
              setTiles(prev => {
                const next = [...prev];
                next[i] = {...next[i], putProgress: p};
                return next;
              });
            });
            setTiles(prev => {
              const next = [...prev];
              next[i] = {
                ...next[i],
                putProgress: 100,
                state: 'URL_OK',
              };
              return next;
            });
            return;
          } catch (err: any) {
            const msg = String(err);
            if (attempt === 0) {
              if (msg.includes('PUT 403')) {
                await refreshTicket(i);
                continue;
              }
              if (
                msg.includes('PUT 408') ||
                msg.includes('PUT 429') ||
                /PUT 5\d\d/.test(msg) ||
                msg.includes('Network error') ||
                msg.includes('timeout')
              ) {
                continue;
              }
            }
            throw err;
          }
        }
      };
      try {
        await attemptUpload();
      } catch (err) {
        console.error(err);
        const name = tilesRef.current[i].file?.name ?? 'image';
        Toast.show({type: 'error', text1: `${name} failed to upload`});
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
    // Build a candidates list with ORIGINAL indexes preserved
    const candidates = tilesRef.current
      .map((t, idx) => ({t, idx}))
      .filter(({t}) => t.state === 'URL_OK');
    const storageKeys = candidates.map(({t}) => t.storageKey!);
    try {
      const res = await finalize({
        variables: {
          input: {
            gymId: Number(form.gymId),
            equipmentId: Number(form.equipmentId),
            storageKeys,
          },
        },
      });
      const payload = res.data.finalizeGymImagesAdmin;
      if (payload.images.length !== candidates.length) {
        console.warn(
          '[FINALIZE] mismatch: returned images',
          payload.images.length,
          'candidates',
          candidates.length,
        );
      }
      // Map storageKey to index for resilience
      const keyMap = new Map<string, number>();
      candidates.forEach(({t, idx}) => {
        if (t.storageKey) keyMap.set(t.storageKey, idx);
      });
      const base = tilesRef.current.slice();
      payload.images.forEach((img: any) => {
        const dest = img.storageKey ? keyMap.get(img.storageKey) : undefined;
        if (dest == null) return;
        base[dest] = {
          ...base[dest],
          state: 'FINALIZED',
          imageId: String(img.id), // GymEquipmentImage.id
        };
      });
      // Write ref first so immediate reads see IDs
      tilesRef.current = base;
      setTiles(base);
      Toast.show({
        type: 'success',
        text1: `Queued ${payload.queuedJobs} jobs`,
      });
      setPhase('TAGGING');
    } catch (err) {
      console.error(err);
      setPhase('PREPARED');
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

  const retryTile = async (index: number) => {
    const t = tilesRef.current[index];
    if (!t?.file) return;
    setTiles(prev => {
      const next = [...prev];
      next[index] = {...next[index], state: 'PUTTING', putProgress: 0};
      return next;
    });
    try {
      await refreshTicket(index);
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          await putWithProgress(
            tilesRef.current[index].file!,
            tilesRef.current[index] as PutItem,
            p => {
              setTiles(prev => {
                const next = [...prev];
                next[index] = {...next[index], putProgress: p};
                return next;
              });
            },
          );
          setTiles(prev => {
            const next = [...prev];
            next[index] = {
              ...next[index],
              putProgress: 100,
              state: 'URL_OK',
            };
            return next;
          });
          break;
        } catch (err: any) {
          const msg = String(err);
          if (attempt === 0) {
            if (msg.includes('PUT 403')) {
              await refreshTicket(index);
              continue;
            }
            if (
              msg.includes('PUT 408') ||
              msg.includes('PUT 429') ||
              /PUT 5\d\d/.test(msg) ||
              msg.includes('Network error') ||
              msg.includes('timeout')
            ) {
              continue;
            }
          }
          throw err;
        }
      }
      const res = await finalize({
        variables: {
          input: {
            gymId: Number(form.gymId),
            equipmentId: Number(form.equipmentId),
            storageKeys: [tilesRef.current[index].storageKey!],
          },
        },
      });
      const img = res.data.finalizeGymImagesAdmin.images?.[0];
      setTiles(prev => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          state: 'FINALIZED',
          imageId: img ? String(img.id) : next[index].imageId,
        };
        return next;
      });
    } catch (err) {
      console.error(err);
      const name = tilesRef.current[index].file?.name ?? 'image';
      Toast.show({type: 'error', text1: `${name} failed to upload`});
      setTiles(prev => {
        const next = [...prev];
        next[index] = {...next[index], state: 'PUT_ERROR'};
        return next;
      });
    }
  };

  const tilesToShow = tiles.filter(t => t.state !== 'REMOVED');

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
            value={
              selectedEquipment ? selectedEquipment.name : 'Select Equipment'
            }
            onPress={() => setEquipmentModalVisible(true)}
            disabled={!selectedGym}
          />
        </View>
        <View style={{marginTop: spacing.md}}>
          <View
            style={{flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm}}>
            {tiles.map((t, idx) =>
              t.state === 'REMOVED' ? null : (
                <ThumbnailTile
                  key={t.storageKey ?? t.previewUri ?? `idx-${idx}`}
                  tile={t}
                  onRemove={() => removeTile(idx)}
                  onRetry={() => retryTile(idx)}
                  canRemove={phase === 'SELECT'}
                />
              ),
            )}

            {phase === 'SELECT' &&
              (Platform.OS === 'web' ? (
                <label style={addTileStyle(theme) as any}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    style={{display: 'none'}}
                    onChange={handleAddWeb}
                  />
                  <Text
                    style={{
                      textAlign: 'center',
                      color: theme.colors.accentStart,
                    }}>
                    ＋ Add image
                  </Text>
                </label>
              ) : (
                <Pressable
                  onPress={pickImagesNative}
                  style={addTileStyle(theme) as any}>
                  <Text
                    style={{
                      textAlign: 'center',
                      color: theme.colors.accentStart,
                    }}>
                    ＋ Add images
                  </Text>
                </Pressable>
              ))}
          </View>
        </View>
        <Button
          text={
            phase === 'SELECT'
              ? 'Upload & Finalize'
              : phase === 'PREPARED'
                ? 'Upload & Finalize'
                : phase === 'UPLOADING'
                  ? 'Uploading…'
                  : 'Done'
          }
          onPress={async () => {
            try {
              if (phase === 'SELECT') {
                await prepareSession(); // will setPhase('PREPARED')
                return; // let React apply setTiles before starting uploads
              }
              if (phase === 'TAGGING') {
                navigate('/admin/equipment-recognition');
                return;
              }
            } catch (e) {
              console.error(e);
              Toast.show({
                type: 'error',
                text1: 'Something went wrong.',
              });
            }
          }}
          disabled={
            preparing ||
            uploading ||
            finalizing ||
            (phase === 'SELECT' &&
              (!selectedGym || !selectedEquipment || tilesToShow.length === 0))
          }
        />
        {(preparing || uploading || finalizing) && <LoadingState />}

        {phase === 'TAGGING' && (
          <>
            <Card style={{marginTop: spacing.md}} compact>
              <Title text="Defaults" />
              <View style={{gap: spacing.sm}}>
                <SelectableField
                  label="Split"
                  value={labelOf(defaults.splitId, splits) || 'Choose'}
                  onPress={() => openDefault('split')}
                />
                <SelectableField
                  label="Source"
                  value={labelOf(defaults.sourceId, sources) || 'Choose'}
                  onPress={() => openDefault('source')}
                />
                <Button text="Apply to all" onPress={applyDefaults} />
              </View>
            </Card>
            <Card title="Tag images" compact style={{marginTop: spacing.md}}>
              {tilesToShow.map((t, idx) => (
                <TagRow
                  key={t.imageId ?? idx}
                  tile={t}
                  angles={angles}
                  heights={heights}
                  distances={distances}
                  lighting={lighting}
                  mirrors={mirrors}
                  onApply={patch => applySingle(t.imageId!, patch)}
                />
              ))}
            </Card>
            <ModalWrapper visible={defaultOpen.visible} onClose={closeDefault}>
              <View style={{padding: spacing.md}}>
                <Title
                  text={`Choose ${currentDefault?.label}`}
                  align="center"
                />
                {currentDefault?.options.map(o => (
                  <OptionItem
                    key={o.id}
                    text={o.label}
                    onPress={() => {
                      setDefaults(
                        prev =>
                          ({
                            ...prev,
                            [`${defaultOpen.k}Id`]: o.id,
                          }) as any,
                      );
                      closeDefault();
                    }}
                  />
                ))}
              </View>
            </ModalWrapper>
          </>
        )}
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
            onSelect={ge => {
              setSelectedEquipment(ge.equipment);
              setForm(prev => ({
                ...prev,
                equipmentId: String(ge.equipment.id),
              }));
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
  onRetry,
  canRemove = true,
}: {
  tile: UploadTile;
  onRemove: () => void;
  onRetry?: () => void;
  canRemove?: boolean;
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
        borderColor: theme.colors.accentStart,
        backgroundColor: theme.colors.surface,
      }}>
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
          }}>
          <View
            style={{
              width: `${tile.putProgress}%`,
              height: 4,
              backgroundColor: theme.colors.accentStart,
            }}
          />
        </View>
      )}
      {tile.state === 'PUT_ERROR' && onRetry && (
        <Pressable
          onPress={onRetry}
          accessibilityLabel="Retry upload"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingVertical: 4,
            backgroundColor: theme.colors.accentStart,
          }}>
          <Text style={{color: 'white', fontSize: 12, textAlign: 'center'}}>
            Retry
          </Text>
        </Pressable>
      )}
      {canRemove && (
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
          }}>
          <Text style={{color: 'white', fontWeight: '700', lineHeight: 22}}>
            ×
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const addTileStyle = (theme: any) => ({
  width: 120,
  height: 120,
  borderRadius: 12,
  borderWidth: 1,
  borderStyle: 'dashed',
  borderColor: theme.colors.accentStart,
  alignItems: 'center',
  justifyContent: 'center',
});

const styles = StyleSheet.create({
  formContainer: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
});

type Opt = {id: number; label: string};
const labelOf = (id?: number, opts: Opt[] = []) =>
  opts.find(o => o.id === id)?.label;

function TagRow({
  tile,
  angles,
  heights,
  distances,
  lighting,
  mirrors,
  onApply,
}: {
  tile: UploadTile;
  angles: Opt[];
  heights: Opt[];
  distances: Opt[];
  lighting: Opt[];
  mirrors: Opt[];
  onApply: (
    patch: Partial<{
      angleId: number;
      heightId: number;
      distanceId: number;
      lightingId: number;
      mirrorId: number;
    }>,
  ) => Promise<void>;
}) {
  const {theme} = useTheme();
  const [open, setOpen] = React.useState<{k?: string; visible: boolean}>({
    visible: false,
  });
  const [local, setLocal] = React.useState<{
    angleId?: number;
    heightId?: number;
    distanceId?: number;
    lightingId?: number;
    mirrorId?: number;
  }>({});

  const thumb = tile.previewUri ?? tile.signedUrl;
  const isWeb = Platform.OS === 'web';

  const openPicker = (k: string) => setOpen({k, visible: true});
  const close = () => setOpen({visible: false});

  const PICKMAP: Record<
    string,
    {label: string; value?: number; options: Opt[]}
  > = {
    angle: {label: 'Angle', value: local.angleId, options: angles},
    lighting: {label: 'Lighting', value: local.lightingId, options: lighting},
    height: {label: 'Height', value: local.heightId, options: heights},
    distance: {label: 'Distance', value: local.distanceId, options: distances},
    mirror: {label: 'Mirror', value: local.mirrorId, options: mirrors},
  };

  const current = open.k ? PICKMAP[open.k] : null;

  return (
    <View
      style={{
        flexDirection: isWeb ? 'row' : 'column',
        gap: spacing.md,
        alignItems: 'flex-start',
        paddingVertical: spacing.sm,
      }}>
      <View
        style={{
          width: 128,
          height: 128,
          borderRadius: 12,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.colors.divider,
        }}>
        <Image
          source={{uri: thumb}}
          style={{width: '100%', height: '100%'}}
          resizeMode="cover"
        />
      </View>

      <View style={{flex: 1, gap: spacing.sm}}>
        <SelectableField
          label="Angle"
          value={labelOf(local.angleId, angles) || 'Choose'}
          onPress={() => openPicker('angle')}
        />
        <SelectableField
          label="Lighting"
          value={labelOf(local.lightingId, lighting) || 'Choose'}
          onPress={() => openPicker('lighting')}
        />
        <SelectableField
          label="Height"
          value={labelOf(local.heightId, heights) || 'Choose'}
          onPress={() => openPicker('height')}
        />
        <SelectableField
          label="Distance"
          value={labelOf(local.distanceId, distances) || 'Choose'}
          onPress={() => openPicker('distance')}
        />
        <SelectableField
          label="Mirror"
          value={labelOf(local.mirrorId, mirrors) || 'Choose'}
          onPress={() => openPicker('mirror')}
        />

        <Button
          text="Save"
          variant="solid"
          onPress={async () => {
            if (!tile.imageId) return;
            await onApply({
              angleId: local.angleId,
              heightId: local.heightId,
              distanceId: local.distanceId,
              lightingId: local.lightingId,
              mirrorId: local.mirrorId,
            });
            Toast.show({type: 'success', text1: 'Saved'});
          }}
          disabled={!tile.imageId}
        />
      </View>

      <ModalWrapper visible={open.visible} onClose={close}>
        <View style={{padding: spacing.md}}>
          <Title text={`Choose ${current?.label}`} align="center" />
          {current?.options.map(o => (
            <OptionItem
              key={o.id}
              text={o.label}
              onPress={() => {
                setLocal(
                  prev =>
                    ({
                      ...prev,
                      [`${open.k}Id`]: o.id,
                    }) as any,
                );
                close();
              }}
            />
          ))}
        </View>
      </ModalWrapper>
    </View>
  );
}

export default BatchCaptureScreen;
