import React, {useMemo, useState} from 'react';
import {View, Text, FlatList} from 'react-native';
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
import {useRoleContext} from 'features/auth/context/RoleContext';

const KnnPlaygroundScreen = () => {
  const [imageId, setImageId] = useState('');
  const [scope, setScope] = useState<'GLOBAL' | 'GYM'>('GLOBAL');
  const [limit, setLimit] = useState(10);
  const [noLatest, setNoLatest] = useState(false);
  const navigate = useNavigate();
  const {theme} = useTheme();
  const role = useRoleContext();
  const activeGymId = role?.gymId ? Number(role.gymId) : undefined;

  const {
    latest,
    isLoading: latestLoading,
    error: latestError,
  } = useLatestEmbeddedImage({scope: 'GYM'});

  const inputError = useMemo(() => {
    if (!imageId?.trim()) return 'Enter an imageId.';
    return null;
  }, [imageId]);

  const input = inputError ? null : {imageId: imageId.trim(), scope, limit};

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
        {scope === 'GYM' && !activeGymId && (
          <ErrorMessage message="You don't have an active gym. Switch role or choose GLOBAL." />
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
    </ScreenLayout>
  );
};

export default KnnPlaygroundScreen;
