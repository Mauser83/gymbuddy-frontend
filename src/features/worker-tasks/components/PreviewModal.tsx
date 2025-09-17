import { useLazyQuery } from '@apollo/client';
import React, { useEffect } from 'react';
import { View, Image, Text, Platform } from 'react-native';

import Button from 'src/shared/components/Button';
import LoadingState from 'src/shared/components/LoadingState';
import ModalWrapper from 'src/shared/components/ModalWrapper';
import NoResults from 'src/shared/components/NoResults';
import { useTheme } from 'src/shared/theme/ThemeProvider';
import { spacing } from 'src/shared/theme/tokens';

import { IMAGE_URL_MANY } from '../graphql/queue.graphql';

interface PreviewModalProps {
  storageKey?: string | null;
  url?: string | null;
  onClose: () => void;
}

const PreviewModal = ({ storageKey, url: urlProp, onClose }: PreviewModalProps) => {
  const { theme } = useTheme();
  const [fetchUrl, { data, loading, error }] = useLazyQuery(IMAGE_URL_MANY, {
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (urlProp) return;
    if (storageKey) {
      fetchUrl({ variables: { keys: [storageKey] } });
    }
  }, [storageKey, urlProp, fetchUrl]);

  const url = urlProp ?? data?.imageUrlMany?.[0]?.url;

  return (
    <ModalWrapper visible={!!storageKey || !!urlProp} onClose={onClose}>
      <View style={{ padding: spacing.lg, alignItems: 'center' }}>
        {loading ? (
          <LoadingState text="Loading..." />
        ) : error ? (
          <NoResults message="Failed to sign preview URL" />
        ) : (
          <>
            {url ? (
              <Image
                source={{ uri: url }}
                style={{ width: 300, height: 300, marginBottom: spacing.md }}
              />
            ) : (
              <NoResults message="No image" />
            )}
            <Text style={{ marginBottom: spacing.md, color: theme.colors.textPrimary }}>
              {storageKey}
            </Text>
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
