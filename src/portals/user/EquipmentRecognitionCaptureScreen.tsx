import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Image,
  Text,
  Switch,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import ScreenLayout from 'shared/components/ScreenLayout';
import Button from 'shared/components/Button';
import Title from 'shared/components/Title';
import * as ImagePicker from 'expo-image-picker';
import * as Device from 'expo-device';
import SelectableField from 'shared/components/SelectableField';
import ModalWrapper from 'shared/components/ModalWrapper';
import GymPickerModal, {
  Gym as PickerGym,
} from 'features/workout-sessions/components/GymPickerModal';
import EquipmentPickerModal from 'features/gyms/components/EquipmentPickerModal';
import useRecognition from 'features/cv/hooks/useRecognition';
import LoadingSpinner from 'shared/components/LoadingSpinner';
import ButtonRow from 'shared/components/ButtonRow';
import {useTheme} from 'shared/theme/ThemeProvider';
import {useThumbUrls} from 'features/cv/hooks/useThumbUrls';

interface CandidateCardProps {
  equipmentId: number;
  title: string;
  imageKey: string;
  score: number;
  onSelect: () => void;
  selected: boolean;
  size: number;
  muted?: boolean;
}

const CandidateCard = ({
  equipmentId,
  title,
  imageKey,
  score,
  onSelect,
  selected,
  size,
  muted,
}: CandidateCardProps) => {
  const {theme} = useTheme();
  const {data, refresh} = useThumbUrls();
  useEffect(() => {
    if (imageKey) refresh([imageKey]);
  }, [imageKey, refresh]);
  const url = data?.imageUrlMany?.[0]?.url;
  void equipmentId;
  void score;

  return (
    <Pressable
      onPress={onSelect}
      style={{
        marginRight: size === 96 ? 12 : 0,
        borderWidth: 2,
        borderColor: selected ? theme.colors.accentStart : 'transparent',
        borderRadius: 12,
        overflow: 'hidden',
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
        opacity: muted ? 0.5 : 1,
      }}>
      {url ? (
        <Image source={{uri: url}} style={{width: size, height: size}} />
      ) : (
        <Text style={{color: theme.colors.textSecondary}}>{title}</Text>
      )}
      {muted && (
        <View
          style={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            backgroundColor: theme.colors.surface,
            paddingHorizontal: 4,
            paddingVertical: 2,
            borderRadius: 4,
          }}>
          <Text style={{color: theme.colors.textSecondary, fontSize: 10}}>
            Low confidence
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const LargeCandidateCard = (props: Omit<CandidateCardProps, 'size'>) => (
  <CandidateCard {...props} size={200} />
);

const SmallCandidateCard = (props: Omit<CandidateCardProps, 'size'>) => (
  <CandidateCard {...props} size={96} />
);

const HorizontalList = ({children}: {children: React.ReactNode}) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{paddingVertical: 4}}>
    {children}
  </ScrollView>
);

const Disclosure = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const {theme} = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={{width: '100%'}}>
      <Pressable onPress={() => setOpen(o => !o)} style={{paddingVertical: 4}}>
        <Text style={{color: theme.colors.textPrimary}}>
          {title} {open ? '▲' : '▼'}
        </Text>
      </Pressable>
      {open && <View style={{marginTop: 8}}>{children}</View>}
    </View>
  );
};

const EmptyState = ({text}: {text: string}) => {
  const {theme} = useTheme();
  return (
    <Text style={{color: theme.colors.textSecondary, textAlign: 'center'}}>
      {text}
    </Text>
  );
};

const EquipmentRecognitionCaptureScreen = () => {
  const {theme} = useTheme();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [offerTraining, setOfferTraining] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [gymModalVisible, setGymModalVisible] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [manualPick, setManualPick] = useState(false);
  const [gym, setGym] = useState<PickerGym | null>(null);
  const [busy, setBusy] = useState(false);
  const [camPerm, requestCamPerm] = ImagePicker.useCameraPermissions();
  const {
    createUploadTicket,
    recognizeImage,
    confirmRecognition,
    discardRecognition,
  } = useRecognition();

  const decision: string | undefined = result?.attempt?.decision;
  const canSelect = decision !== 'RETAKE' || manualPick;
  const fallbackFromImages = (list?: any[]) => {
    if (!list?.length) return [];
    const sorted = [...list].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const seen = new Set<number>();
    const dedup: any[] = [];
    for (const c of sorted) {
      if (seen.has(c.equipmentId)) continue;
      seen.add(c.equipmentId);
      dedup.push({
        equipmentId: c.equipmentId,
        equipmentName: undefined,
        topScore: c.score ?? 0,
        representative: c,
        source: 'GYM',
        totalImagesConsidered: 1,
      });
      if (dedup.length >= 3) break;
    }
    return dedup;
  };

  const eqCandidates: any[] =
    result?.equipmentCandidates ??
    fallbackFromImages(result?.gymCandidates) ??
    [];
  const primary = useMemo(() => {
    if (!eqCandidates.length) return null;
    return eqCandidates[0];
  }, [eqCandidates]);

  const alternates = useMemo(() => {
    if (eqCandidates.length <= 1) return [];
    return eqCandidates.slice(1);
  }, [eqCandidates]);

  useEffect(() => {
    if (primary && selected == null) {
      setSelected(primary.equipmentId);
    }
  }, [primary, selected]);

  const ensureCameraPermission = async () => {
    if (camPerm?.granted) return true;
    const res = await requestCamPerm();
    if (res.granted) return true;
    Alert.alert(
      'Camera permission needed',
      'Please enable Camera access in Settings to take a photo.',
      [
        {text: 'Open Settings', onPress: () => Linking.openSettings?.()},
        {text: 'Cancel', style: 'cancel'},
      ],
    );
    return false;
  };

  const pickFromLibraryFallback = async () =>
    ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });

  const uploadAndRecognize = async (uri: string) => {
    if (!gym) throw new Error('Gym not selected');
    const ticket = await createUploadTicket(Number(gym.id), 'jpg');
    const t = ticket.data?.createRecognitionUploadTicket;
    if (!t) throw new Error('Failed to create upload ticket');

    const blob = await (await fetch(uri)).blob();
    await fetch(t.putUrl, {
      method: 'PUT',
      headers: {'Content-Type': 'image/jpeg'},
      body: blob,
    });

    const payload = await recognizeImage(t.ticketToken, 3);

    if (!payload) throw new Error('recognizeImage returned no data');

    setResult(payload);
    setSelected(null);
  };

    const handleCapture = async () => {
    try {
      if (!gym) {
        setGymModalVisible(true);
        return;
      }

      setBusy(true);

      const canUseCamera =
        Platform.OS !== 'ios' ? true : await ensureCameraPermission();
      if (!canUseCamera) {
        setBusy(false);
        return;
      }

      const isSimulator = !Device.isDevice;
      const res = isSimulator
        ? await pickFromLibraryFallback()
        : await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            cameraType: ImagePicker.CameraType.back,
          });

      if (res.canceled || !res.assets?.[0]?.uri) {
        setBusy(false);
        return;
      }

      const asset = res.assets[0];
      setImageUri(asset.uri);

      await uploadAndRecognize(asset.uri);
    } catch (e) {
      console.error(e);
      Alert.alert('Capture failed', (e as Error)?.message ?? 'Unknown error');
    } finally {
      setBusy(false);
    }
  };


  const handleConfirm = async () => {
    if (!result || selected == null) return;
    await confirmRecognition(
      String(result.attempt.attemptId),
      Number(selected),
      offerTraining,
    );
    setImageUri(null);
    setResult(null);
    setOfferTraining(false);
    setSelected(null);
    setManualPick(false);
  };

  const handleRetake = async () => {
    if (result?.attempt?.attemptId) {
      await discardRecognition(String(result.attempt.attemptId));
    }
    setImageUri(null);
    setResult(null);
    setOfferTraining(false);
    setSelected(null);
    setManualPick(false);
  };

  const handleRetakeCapture = async () => {
    await handleRetake();
    await handleCapture();
  };

  let content: React.ReactNode = null;
  if (busy) {
    content = <LoadingSpinner />;
  } else if (!imageUri) {
    content = <Button text="Capture Photo" onPress={handleCapture} />;
  } else if (result) {
    content = (
      <View style={{gap: 16, alignItems: 'center'}}>
        <Image source={{uri: imageUri}} style={{width: 200, height: 200}} />
        {primary ? (
          <>
            <LargeCandidateCard
              equipmentId={primary.equipmentId}
              title={primary.equipmentName ?? `#${primary.equipmentId}`}
              imageKey={primary.representative.storageKey}
              score={primary.topScore}
              onSelect={() => setSelected(primary.equipmentId)}
              selected={selected === primary.equipmentId}
              muted={primary.topScore < 0.7}
            />
            {primary.topScore >= 0.9 && (
              <Text style={{color: theme.colors.textSecondary}}>
                Looks like {primary.equipmentName ?? `#${primary.equipmentId}`} (90%+)
              </Text>
            )}
            {alternates.length > 0 && (
              <Disclosure title={`Other options (${alternates.length})`}>
                <HorizontalList>
                  {alternates.map(c => (
                  <SmallCandidateCard
                    key={c.equipmentId}
                    equipmentId={c.equipmentId}
                    title={c.equipmentName ?? `#${c.equipmentId}`}
                    imageKey={c.representative.storageKey}
                    score={c.topScore}
                    onSelect={() => setSelected(c.equipmentId)}
                    selected={selected === c.equipmentId}
                    muted={c.topScore < 0.7}
                  />
                ))}
              </HorizontalList>
              </Disclosure>
            )}
          </>
        ) : (
          <>
            <EmptyState text="No good match. Try retaking the photo." />
            {!manualPick && (
              <Button
                text="Pick equipment manually"
                onPress={() => setPickerOpen(true)}
              />
            )}
          </>
        )}
        {canSelect && (
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <Switch value={offerTraining} onValueChange={setOfferTraining} />
            <Text style={{flex: 1, color: theme.colors.textPrimary}}>
              Help improve recognition by allowing this photo to be used for
              training.
            </Text>
          </View>
        )}
        <ButtonRow>
          <Button
            text="Confirm"
            onPress={handleConfirm}
            disabled={!canSelect || selected == null}
          />
          <Button text="Retake" onPress={handleRetakeCapture} />
        </ButtonRow>
      </View>
    );
  } else {
    content = (
      <View style={{gap: 16, alignItems: 'center'}}>
        <Image source={{uri: imageUri}} style={{width: 200, height: 200}} />
        <Button text="Retry" onPress={handleCapture} />
      </View>
    );
  }

  return (
    <ScreenLayout scroll>
      <Title text="Recognize Equipment" align="center" />
      <SelectableField
        label="Gym"
        value={gym?.name || 'Select gym'}
        onPress={() => setGymModalVisible(true)}
      />
      {content}
      <ModalWrapper
        visible={gymModalVisible}
        onClose={() => setGymModalVisible(false)}>
        <GymPickerModal
          onClose={() => setGymModalVisible(false)}
          onSelect={g => {
            setGym(g);
            setGymModalVisible(false);
          }}
        />
      </ModalWrapper>
      <ModalWrapper
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}>
        {gym && (
          <EquipmentPickerModal
            gymId={gym.id}
            onClose={() => setPickerOpen(false)}
            onSelect={ge => {
              setPickerOpen(false);
              setManualPick(true);
              setSelected(ge.id);
            }}
          />
        )}
      </ModalWrapper>
    </ScreenLayout>
  );
};

export default EquipmentRecognitionCaptureScreen;
