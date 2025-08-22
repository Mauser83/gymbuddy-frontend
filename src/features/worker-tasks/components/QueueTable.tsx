import React from 'react';
import {ScrollView} from 'react-native';
import LoadingSpinner from 'shared/components/LoadingSpinner';
import NoResults from 'shared/components/NoResults';
import QueueRow from './QueueRow';
import type {ImageQueueItem} from '../types';

interface QueueTableProps {
  items: ImageQueueItem[];
  loading: boolean;
  onRetry: (item: ImageQueueItem) => void;
  onPreview: (key: string) => void;
}

const QueueTable = ({items, loading, onRetry, onPreview}: QueueTableProps) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!items.length) {
    return <NoResults message="No jobs" />;
  }

  return (
    <ScrollView>
      {items.map(item => (
        <QueueRow
          key={item.id}
          item={item}
          onRetry={onRetry}
          onPreview={onPreview}
        />
      ))}
    </ScrollView>
  );
};

export default QueueTable;