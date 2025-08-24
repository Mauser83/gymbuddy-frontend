import React from 'react';
import {View, Text, Image, TouchableOpacity} from 'react-native';
import Card from 'shared/components/Card';
import LoadingState from 'shared/components/LoadingState';
import {useTheme} from 'shared/theme/ThemeProvider';
import type {ImageJobGroup, ImageQueueItem, ImageJobType} from '../types';

type Props = {
  groups: ImageJobGroup[];
  thumbs: Record<string, string>;
  loading: boolean;
  onOpenRaw: (url: string) => void;
};

const copy = (text?: string | null) => {
  if (!text) return;
  (globalThis as any).navigator?.clipboard?.writeText(text);
};

const StatusChip = ({
  status,
  text,
}: {
  status: ImageQueueItem['status'];
  text: string;
}) => {
  const {theme} = useTheme();
  const colorMap: Record<ImageQueueItem['status'], string> = {
    pending: theme.colors.textSecondary,
    processing: theme.colors.accentStart,
    succeeded: theme.colors.textPrimary,
    failed: theme.colors.error,
  };
  const color = colorMap[status];
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: color,
      }}>
      <Text style={{color, fontWeight: '600'}}>{text}</Text>
    </View>
  );
};

export default function QueueTable({
  groups,
  thumbs,
  loading,
  onOpenRaw,
}: Props) {
  if (loading) return <LoadingState text="Loading..." />;

  return (
    <View>
      {groups.map(g => {
        const thumbUrl = g.storageKey ? thumbs[g.storageKey] : undefined;
        const line = (jt: ImageJobType) => {
          const j = g.jobs[jt];
          const status = j?.status ?? 'pending';
          const label = jt.toUpperCase();
          const failed = status === 'failed';
          const showAttempts = failed && (j?.attempts ?? 0) > 0;
return (
            <View
              key={jt}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 6,
              }}>
              <View
                style={{flexDirection: 'row', gap: 8, alignItems: 'center'}}>
                <StatusChip status={status} text={label} />
                {failed && j?.lastError ? (
                  <Text
                    onPress={() => copy(j.lastError)}
                    style={{opacity: 0.8, textDecorationLine: 'underline'}}>
                    error
                  </Text>
                ) : null}
              </View>
              <View
                style={{flexDirection: 'row', gap: 8, alignItems: 'center'}}>
                {showAttempts && <Text>attempts: {j?.attempts}</Text>}
              </View>
            </View>
          );
        };

        return (
          <Card key={g.key} compact style={{marginBottom: 10, padding: 10}}>
            <View style={{flexDirection: 'row', gap: 12}}>
              <View style={{width: 120}}>
                {thumbUrl ? (
                  <TouchableOpacity onPress={() => onOpenRaw(thumbUrl)}>
                    <Image
                      source={{uri: thumbUrl}}
                      style={{width: 120, height: 120, borderRadius: 8}}
                    />
                  </TouchableOpacity>
                ) : (
                  <View
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 8,
                      backgroundColor: '#222',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text style={{opacity: 0.6}}>no image</Text>
                  </View>
                )}
              </View>
              <View style={{flex: 1}}>
                {g.jobs.hash && line('hash')}
                <View
                  style={{height: 1, opacity: 0.05, backgroundColor: '#fff'}}
                />
                {g.jobs.safety && line('safety')}
                <View
                  style={{height: 1, opacity: 0.05, backgroundColor: '#fff'}}
                />
                {g.jobs.embed && line('embed')}
              </View>
            </View>
          </Card>
        );
      })}
    </View>
  );
}