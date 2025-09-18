import React from 'react';
import { View, Text, Image, Pressable, Platform } from 'react-native';

import Card from 'src/shared/components/Card';
import LoadingState from 'src/shared/components/LoadingState';
import { useTheme } from 'src/shared/theme/ThemeProvider';

import type { ImageJobGroup, ImageQueueItem, ImageJobType } from '../types';

type Props = {
  groups: ImageJobGroup[];
  thumbs: Record<string, string>;
  loading: boolean;
  onOpenRaw: (payload: { url: string; storageKey?: string }) => void;
};

const StatusChip = ({ status, text }: { status: ImageQueueItem['status']; text: string }) => {
  const { theme } = useTheme();
  // Prefer theme tokens; fall back to bright colors if not present
  const GREEN = (theme.colors as any).success ?? '#22c55e';
  const RED = theme.colors.error ?? '#ef4444';
  const YELLOW = (theme.colors as any).warning ?? '#eab308';
  const colorMap: Record<ImageQueueItem['status'], string> = {
    succeeded: GREEN,
    failed: RED,
    pending: YELLOW,
    processing: YELLOW,
  };
  const color = colorMap[status] ?? YELLOW;
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: color,
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '700' }}>{text}</Text>
    </View>
  );
};

export default function QueueTable({ groups, thumbs, loading, onOpenRaw }: Props) {
  const { theme } = useTheme();
  if (loading) return <LoadingState text="Loading..." />;

  return (
    <View>
      {groups.map((g) => {
        const thumbUrl = g.storageKey ? thumbs[g.storageKey] : undefined;
        const line = (jt: ImageJobType) => {
          const j = g.jobs[jt];
          // If worker left it "pending" but set lastError, visually treat as failed
          const rawStatus = (j?.status ?? 'pending') as ImageQueueItem['status'];
          const status: ImageQueueItem['status'] =
            rawStatus !== 'succeeded' && j?.lastError ? 'failed' : rawStatus;
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
              }}
            >
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <StatusChip status={status} text={label} />
              </View>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                {showAttempts && (
                  <Text style={{ color: theme.colors.textPrimary }}>attempts: {j?.attempts}</Text>
                )}
              </View>
            </View>
          );
        };

        return (
          <Card key={g.key} compact style={{ marginBottom: 10, padding: 10 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 120 }}>
                {thumbUrl ? (
                  <Pressable
                    onPress={() =>
                      onOpenRaw({
                        url: thumbUrl,
                        storageKey: g.storageKey ?? undefined,
                      })
                    }
                    {...(Platform.OS === 'web' ? { role: 'link', tabIndex: 0 } : {})}
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 8,
                      overflow: 'hidden',
                    }}
                  >
                    <Image source={{ uri: thumbUrl }} style={{ width: '100%', height: '100%' }} />
                  </Pressable>
                ) : (
                  <View
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 8,
                      backgroundColor: '#222',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ opacity: 0.6 }}>no image</Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                {g.jobs.hash && line('hash')}
                <View style={{ height: 1, opacity: 0.05, backgroundColor: '#fff' }} />
                {g.jobs.safety && line('safety')}
                <View style={{ height: 1, opacity: 0.05, backgroundColor: '#fff' }} />
                {g.jobs.embed && line('embed')}
              </View>
            </View>
          </Card>
        );
      })}
    </View>
  );
}
