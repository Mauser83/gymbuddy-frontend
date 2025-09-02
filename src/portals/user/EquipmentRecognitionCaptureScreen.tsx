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
  const candidateList = useMemo(() => {
    if (!result) return [];
    switch (decision) {
      case 'GLOBAL_ACCEPT':
        return result.globalCandidates ?? [];
      case 'GYM_ACCEPT':
      case 'GYM_SELECT':
        return result.gymCandidates ?? [];
      case 'RETAKE':
        return [];
      default:
        return [];
    }
  }, [result, decision]);
  const candidateKeys = useMemo(
    () => candidateList.map((c: any) => c.storageKey),
    [candidateList],
  );
  const {data: thumbData, refresh: refreshThumbs} = useThumbUrls();
  useEffect(() => {
    refreshThumbs(candidateKeys);
  }, [refreshThumbs, candidateKeys]);
  const thumbs = useMemo(() => {
    const record: Record<string, string> = {};
    thumbData?.imageUrlMany?.forEach((r: any) => {
      record[r.storageKey] = r.url;
    });
    return record;
  }, [thumbData]);
  const candidateUrl = (key: string) => thumbs[key] ?? null;

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

    const rec = await recognizeImage(t.ticketToken, 3);
    const payload = rec.data?.recognizeImage;
    if (!payload) throw new Error('recognizeImage returned no data');

    const stageCandidates =
      payload?.attempt?.decision === 'GLOBAL_ACCEPT'
        ? payload.globalCandidates
        : payload.gymCandidates;
    const top = stageCandidates?.[0] ?? null;

    setResult(payload);
    setSelected(top?.equipmentId ?? null);
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
        {decision === 'RETAKE' ? (
          <>
            <Text style={{color: theme.colors.textSecondary}}>
              Low confidence (&lt;55%). Please retake.
            </Text>
            {!manualPick && (
              <Button
                text="Pick equipment manually"
                onPress={() => setPickerOpen(true)}
              />
            )}
          </>
        ) : (
          candidateList.length > 0 && (
            <View style={{width: '100%', gap: 12}}>
              <Text style={{color: theme.colors.textSecondary}}>
                Pick the closest match:
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{paddingVertical: 4}}>
                {candidateList.map((c: any) => {
                  const url = candidateUrl(c.storageKey);
                  const isSelected = selected === c.equipmentId;
                  return (
                    <Pressable
                      key={`${c.equipmentId}-${c.imageId}`}
                      onPress={() => setSelected(c.equipmentId)}
                      style={{
                        marginRight: 12,
                        borderWidth: 2,
                        borderColor: isSelected
                          ? theme.colors.accentStart
                          : 'transparent',
                        borderRadius: 12,
                        overflow: 'hidden',
                        width: 96,
                        height: 96,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.colors.surface,
                      }}>
                      {url ? (
                        <Image
                          source={{uri: url}}
                          style={{width: 96, height: 96}}
                        />
                      ) : (
                        <Text
                          style={{
                            color: theme.colors.textSecondary,
                            padding: 8,
                          }}>
                          #{c.equipmentId}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )
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
