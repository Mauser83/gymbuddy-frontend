import React, {useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import Button from 'shared/components/Button';
import {spacing} from 'shared/theme/tokens';
import {useTheme} from 'shared/theme/ThemeProvider';
import ErrorPanel from './ErrorPanel';
import type {ImageQueueItem} from '../types';

interface QueueRowProps {
  item: ImageQueueItem;
  onRetry: (item: ImageQueueItem) => void;
  onPreview: (key: string) => void;
}

const QueueRow = ({item, onRetry, onPreview}: QueueRowProps) => {
  const {theme} = useTheme();
  const [expanded, setExpanded] = useState(false);

  const statusColor: Record<ImageQueueItem['status'], string> = {
    pending: theme.colors.textSecondary,
    running: theme.colors.accentStart,
    done: theme.colors.textPrimary,
    failed: theme.colors.error,
  };

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderColor: theme.colors.layoutBorder,
        paddingVertical: spacing.sm,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
        }}>
        <Text style={{color: statusColor[item.status], flex: 1}}>
          {item.status.toUpperCase()}
        </Text>
        <Text style={{flex: 1}}>{item.jobType.toUpperCase()}</Text>
        <View style={{flex: 2}}>
          {item.storageKey ? (
            <TouchableOpacity onPress={() => onPreview(item.storageKey!)}>
              <Text style={{color: theme.colors.accentStart}} numberOfLines={1}>
                Preview {item.storageKey}
              </Text>
            </TouchableOpacity>
          ) : item.imageId ? (
            <TouchableOpacity
              onPress={() => console.log('open image', item.imageId)}>
              <Text style={{color: theme.colors.accentStart}} numberOfLines={1}>
                Open {item.imageId}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={{color: theme.colors.textSecondary}}>(n/a)</Text>
          )}
        </View>
        <Text style={{width: 40, textAlign: 'center'}}>{item.attempts}</Text>
        {item.lastError && (
          <TouchableOpacity onPress={() => setExpanded(!expanded)}>
            <Text style={{color: theme.colors.accentStart}}>
              {expanded ? 'Hide' : 'Error'}
            </Text>
          </TouchableOpacity>
        )}
        <Button
          text="Retry"
          variant={item.status === 'failed' ? 'solid' : 'outline'}
          onPress={() => onRetry(item)}
          small
        />
      </View>
      {expanded && <ErrorPanel error={item.lastError} />}
    </View>
  );
};

export default QueueRow;