import React, {useMemo, useState} from 'react';
import {View, Text, Image, FlatList} from 'react-native';
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
import {spacing, borderRadius} from 'shared/theme/tokens';
import {useTheme} from 'shared/theme/ThemeProvider';
import { useKnnSearch } from 'features/cv/hooks/useKnnSearch';
import { useLatestEmbeddedImage } from 'features/cv/hooks/useLatestEmbeddedImage';
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

  const {fetchLatest, loading: latestLoading, error: latestError} =
    useLatestEmbeddedImage();

  const inputError = useMemo(() => {
    if (!imageId) return 'Image ID is required';
    if (!/^\d+$/.test(imageId)) return 'Image ID must be numeric';
    return null;
  }, [imageId]);

  const input = inputError ? null : {imageId, scope, limit};

  const {neighbors, thumbs, error: knnError, isLoading: knnLoading} =
    useKnnSearch(input);

  const error = knnError || latestError;
  const isLoading = knnLoading || latestLoading;

  const sorted = useMemo(
    () => [...neighbors].sort((a, b) => b.score - a.score),
    [neighbors],
  );

  const handleUseLatest = async () => {
    setNoLatest(false);
    try {
      const res = await fetchLatest(activeGymId);
      const id = res.data?.latestEmbeddedImage?.imageId;
      if (id) {
        setImageId(String(id));
      } else {
        setImageId('');
        setNoLatest(true);
      }
    } catch {}
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
          <Button
            text="GLOBAL"
            onPress={() => setScope('GLOBAL')}
            variant={scope === 'GLOBAL' ? 'solid' : 'outline'}
            small
          />
          <Button
            text="GYM"
            onPress={() => setScope('GYM')}
            variant={scope === 'GYM' ? 'solid' : 'outline'}
            small
          />
        </ButtonRow>
        <View style={{marginBottom: spacing.md}}>
          <Text>Limit: {limit}</Text>
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
          <ErrorMessage message={String(error)} containerStyle={{marginBottom: spacing.md}} />
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
            renderItem={({item, index}) => (
              <Card
                variant="glass"
                style={{marginBottom: spacing.md}}>
                {thumbs[index] && (
                  <Image
                    source={{uri: thumbs[index]!}}
                    style={{
                      width: '100%',
                      height: 200,
                      borderRadius: borderRadius.md,
                      marginBottom: spacing.sm,
                    }}
                  />
                )}
                <Text style={{marginBottom: spacing.xs}}>
                  score: {item.score.toFixed(3)}
                </Text>
                {item.equipmentId && (
                  <Text style={{marginBottom: spacing.sm}}>
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
          sorted.map((n, i) => (
            <Card key={n.imageId} variant="glass" style={{marginBottom: spacing.md}}>
              {thumbs[i] && (
                <Image
                  source={{uri: thumbs[i]!}}
                  style={{
                    width: '100%',
                    height: 200,
                    borderRadius: borderRadius.md,
                    marginBottom: spacing.sm,
                  }}
                />
              )}
              <Text style={{marginBottom: spacing.xs}}>
                score: {n.score.toFixed(3)}
              </Text>
              {n.equipmentId && (
                <Text style={{marginBottom: spacing.sm}}>
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