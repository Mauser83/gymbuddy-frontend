import React, {useEffect} from 'react';
import {View, Image, Text, Platform} from 'react-native';
import ModalWrapper from 'shared/components/ModalWrapper';
import Button from 'shared/components/Button';
import {useLazyQuery} from '@apollo/client';
import {IMAGE_URL_MANY} from '../graphql/queue.graphql';
import {spacing} from 'shared/theme/tokens';
import LoadingState from 'shared/components/LoadingState';
import NoResults from 'shared/components/NoResults';
import { useTheme } from 'shared/theme/ThemeProvider';

interface PreviewModalProps {
  storageKey: string | null;
  onClose: () => void;
}

const PreviewModal = ({storageKey, onClose}: PreviewModalProps) => {
  const {theme} = useTheme();
  const [fetchUrl, {data, loading}] = useLazyQuery(IMAGE_URL_MANY, {
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (storageKey) {
      fetchUrl({variables: {keys: [storageKey], ttl: 300}});
    }
  }, [storageKey, fetchUrl]);

  const url = data?.imageUrlMany?.[0]?.url;

  return (
    <ModalWrapper visible={!!storageKey} onClose={onClose}>
      <View style={{padding: spacing.lg, alignItems: 'center'}}>
        {loading ? (
          <LoadingState text='Loading...'/>
        ) : (
          <>
            {url ? (
              <Image
                source={{uri: url}}
                style={{width: 300, height: 300, marginBottom: spacing.md}}
              />
            ) : (
              <NoResults message="No image"/>
            )}
            <Text style={{marginBottom: spacing.md, color: theme.colors.textPrimary}}>{storageKey}</Text>
            {url && Platform.OS === 'web' && (
              <a href={url} target="_blank" rel="noreferrer">
                Open raw
              </a>
            )}
            <Button text="Close" onPress={onClose} />
          </>
        )}
      </View>
    </ModalWrapper>
  );
};

export default PreviewModal;