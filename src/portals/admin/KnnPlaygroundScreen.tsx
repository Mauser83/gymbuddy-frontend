import React, {useMemo, useState, useEffect} from 'react';
import {View, Text, FlatList, Image} from 'react-native';
import {useNavigate} from 'react-router-native';
import ScreenLayout from 'shared/components/ScreenLayout';
import Card from 'shared/components/Card';
import Title from 'shared/components/Title';
import Button from 'shared/components/Button';
import ButtonRow from 'shared/components/ButtonRow';
import SearchInput from 'shared/components/SearchInput';
import ErrorMessage from 'shared/components/ErrorMessage';
import LoadingState from 'shared/components/LoadingState';
import NoResults from 'shared/components/NoResults';
import Slider from '@react-native-community/slider';
import {spacing} from 'shared/theme/tokens';
import {useTheme} from 'shared/theme/ThemeProvider';
import {useKnnSearch} from 'features/cv/hooks/useKnnSearch';
import {useLatestEmbeddedImage} from 'features/cv/hooks/useLatestEmbeddedImage';
import {useThumbUrls} from 'features/cv/hooks/useThumbUrls';
import ModalWrapper from 'shared/components/ModalWrapper';
import SelectableField from 'shared/components/SelectableField';
import GymPickerModal, {
  Gym,
} from 'features/workout-sessions/components/GymPickerModal';

const KnnPlaygroundScreen = () => {
  const [imageId, setImageId] = useState('');
  const [scope, setScope] = useState<'GLOBAL' | 'GYM'>('GLOBAL');
  const [limit, setLimit] = useState(10);
  const [noLatest, setNoLatest] = useState(false);
  const navigate = useNavigate();
  const {theme} = useTheme();
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [gymModalVisible, setGymModalVisible] = useState(false);
  const activeGymId = selectedGym?.id;

  const {
    latest,
    isLoading: latestLoading,
    error: latestError,
  } = useLatestEmbeddedImage(
    activeGymId ? {scope: 'GYM', gymId: activeGymId} : null,
  );

  const inputError = useMemo(() => {
    if (!imageId?.trim()) return 'Enter an imageId.';
    if (scope === 'GYM' && !activeGymId) return 'Select a gym.';
    return null;
  }, [imageId, scope, activeGymId]);

  const input =
    inputError || (scope === 'GYM' && !activeGymId)
      ? null
      : {
          imageId: imageId.trim(),
          scope,
          limit,
          gymId: scope === 'GYM' ? activeGymId : undefined,
        };

  const {
    neighbors,
    error: knnError,
    isLoading: knnLoading,
  } = useKnnSearch(input);

  const error = knnError || latestError;
  const isLoading = knnLoading || latestLoading;

  const sorted = useMemo(
    () => [...neighbors].sort((a, b) => b.score - a.score),
    [neighbors],
  );

  const storageKeys = useMemo(
    () => sorted.map(n => n.storageKey).filter(Boolean),
    [sorted],
  );
  const {data: thumbData, refresh: refreshThumbs} = useThumbUrls();
  useEffect(() => {
    refreshThumbs(storageKeys);
  }, [refreshThumbs, storageKeys]);
  const thumbs = useMemo(() => {
    const record: Record<string, string> = {};
    thumbData?.imageUrlMany?.forEach((r: any) => {
      record[r.storageKey] = r.url;
    });
    return record;
  }, [thumbData]);

  const handleUseLatest = () => {
    setNoLatest(false);
    if (latest?.imageId) {
      setImageId(latest.imageId);
      setScope(latest.scope === 'GLOBAL' ? 'GLOBAL' : 'GYM');
    } else {
      setImageId('');
      setNoLatest(true);
    }
  };

  return (
    <ScreenLayout scroll>
      <Card variant="glass">
        <Title text="KNN Playground" subtitle="Search nearest neighbors" />
        <SearchInput
          value={imageId}
          onChange={v => {
            setImageId(v);
            setNoLatest(false);
          }}
          placeholder="Image ID"
          onClear={() => {
            setImageId('');
            setNoLatest(false);
          }}
        />
        {inputError && !noLatest && <ErrorMessage message={inputError} />}
        <ButtonRow>
          <Button text="Use latest embedded" onPress={handleUseLatest} small />
          <Button text="GLOBAL" onPress={() => setScope('GLOBAL')} small />
          <Button text="GYM" onPress={() => setScope('GYM')} small />
        </ButtonRow>
        {scope === 'GYM' && (
          <>
            <SelectableField
              label="Gym"
              value={selectedGym ? selectedGym.name : 'Select Gym'}
              onPress={() => setGymModalVisible(true)}
            />
            {!selectedGym && (
              <ErrorMessage message="Select a gym or choose GLOBAL." />
            )}
          </>
        )}
        <View style={{marginBottom: spacing.md}}>
          <Text style={{color: theme.colors.textPrimary}}>Limit: {limit}</Text>
          <Slider
            minimumValue={5}
            maximumValue={50}
            step={1}
            value={limit}
            onValueChange={v => setLimit(Math.round(v))}
            minimumTrackTintColor={theme.colors.accentStart}
            maximumTrackTintColor={theme.colors.disabledSurface}
          />
        </View>
        {isLoading && <LoadingState text="Searching..." />}
        {error && (
          <ErrorMessage
            message={String(error)}
            containerStyle={{marginBottom: spacing.md}}
          />
        )}
        {!isLoading && !error && noLatest && (
          <NoResults message="No embedded images yet for this gym. Finalize some uploads first." />
        )}
        {!isLoading && !error && !noLatest && input && sorted.length === 0 && (
          <NoResults message="No neighbors found." />
        )}
        {sorted.length > 50 ? (
          <FlatList
            data={sorted}
            keyExtractor={item => item.imageId}
            renderItem={({item}) => (
              <Card variant="glass" style={{marginBottom: spacing.md}}>
                {!!thumbs?.[item.storageKey] && (
                  <Image
                    source={{uri: thumbs[item.storageKey]}}
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 12,
                      marginBottom: spacing.sm,
                    }}
                  />
                )}
                <Text
                  style={{
                    marginBottom: spacing.xs,
                    color: theme.colors.textPrimary,
                  }}>
                  score: {item.score.toFixed(3)}
                </Text>
                {item.equipmentId && (
                  <Text
                    style={{
                      marginBottom: spacing.sm,
                      color: theme.colors.textPrimary,
                    }}>
                    equipmentId: {item.equipmentId}
                  </Text>
                )}
                <Button
                  text="Open in Images"
                  onPress={() => navigate(`/admin/images?id=${item.imageId}`)}
                  small
                />
              </Card>
            )}
          />
        ) : (
          sorted.map(n => (
            <Card
              key={n.imageId}
              variant="glass"
              style={{marginBottom: spacing.md}}>
              {!!thumbs?.[n.storageKey] && (
                <Image
                  source={{uri: thumbs[n.storageKey]}}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 12,
                    marginBottom: spacing.sm,
                  }}
                />
              )}
              <Text
                style={{
                  marginBottom: spacing.xs,
                  color: theme.colors.textPrimary,
                }}>
                score: {n.score.toFixed(3)}
              </Text>
              {n.equipmentId && (
                <Text
                  style={{
                    marginBottom: spacing.sm,
                    color: theme.colors.textPrimary,
                  }}>
                  equipmentId: {n.equipmentId}
                </Text>
              )}
              <Button
                text="Open in Images"
                onPress={() => navigate(`/admin/images?id=${n.imageId}`)}
                small
              />
            </Card>
          ))
        )}
      </Card>
      <ModalWrapper
        visible={gymModalVisible}
        onClose={() => setGymModalVisible(false)}>
        {gymModalVisible && (
          <GymPickerModal
            onClose={() => setGymModalVisible(false)}
            onSelect={gym => {
              setSelectedGym(gym);
              setGymModalVisible(false);
            }}
          />
        )}
      </ModalWrapper>
    </ScreenLayout>
  );
};

export default KnnPlaygroundScreen;
