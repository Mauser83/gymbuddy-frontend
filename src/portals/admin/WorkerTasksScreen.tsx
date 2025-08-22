import React, {useState} from 'react';
import {View} from 'react-native';
import ScreenLayout from 'shared/components/ScreenLayout';
import Card from 'shared/components/Card';
import Title from 'shared/components/Title';
import SelectableField from 'shared/components/SelectableField';
import SearchInput from 'shared/components/SearchInput';
import Button from 'shared/components/Button';
import ModalWrapper from 'shared/components/ModalWrapper';
import OptionItem from 'shared/components/OptionItem';
import {spacing} from 'shared/theme/tokens';
import {useImageQueue} from 'features/worker-tasks/hooks/useImageQueue';
import QueueTable from 'features/worker-tasks/components/QueueTable';
import PreviewModal from 'features/worker-tasks/components/PreviewModal';
import {
  ImageJobStatus,
  ImageJobType,
  ImageQueueItem,
} from 'features/worker-tasks/types';
import {useMutation} from '@apollo/client';
import {RETRY_IMAGE_JOB} from 'features/worker-tasks/graphql/queue.graphql';

const allStatuses: ImageJobStatus[] = ['pending', 'running', 'done', 'failed'];
const allTypes: ImageJobType[] = ['hash', 'safety', 'embed'];

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  React.useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

const WorkerTasksScreen = () => {
  const [status, setStatus] = useState<ImageJobStatus[]>(allStatuses);
  const [jobType, setJobType] = useState<ImageJobType[]>(allTypes);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [autoRefreshOn, setAutoRefreshOn] = useState(true);
  const [statusModal, setStatusModal] = useState(false);
  const [typeModal, setTypeModal] = useState(false);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [retryImageJob] = useMutation(RETRY_IMAGE_JOB);

  const {items, loading, refetch} = useImageQueue(
    {status, jobType, query: debouncedSearch, limit: 50},
    {pollMs: autoRefreshOn ? 10000 : 0, pauseOnHidden: true},
  );

  const toggleStatus = (s: ImageJobStatus) => {
    setStatus(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s],
    );
  };

  const toggleType = (t: ImageJobType) => {
    setJobType(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t],
    );
  };

  const onRetry = async (item: ImageQueueItem) => {
    try {
      await retryImageJob({variables: {id: item.id}});
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ScreenLayout scroll={false}>
      <Card variant="glass" compact>
        <Title text="Worker Tasks" subtitle="Background job controls" />
        <View style={{gap: spacing.md}}>
          <SelectableField
            label="Status"
            value={status.join(', ')}
            onPress={() => setStatusModal(true)}
          />
          <SelectableField
            label="Job Type"
            value={jobType.join(', ')}
            onPress={() => setTypeModal(true)}
          />
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="imageId, storageKey, or text"
            onClear={() => setSearch('')}
          />
          <View style={{flexDirection: 'row', gap: spacing.md}}>
            <Button
              text="Refresh"
              onPress={() => refetch()}
              small
            />
            <Button
              text={autoRefreshOn ? 'Auto On' : 'Auto Off'}
              onPress={() => setAutoRefreshOn(!autoRefreshOn)}
              small
            />
          </View>
        </View>
      </Card>
      <QueueTable
        items={items}
        loading={loading}
        onRetry={onRetry}
        onPreview={key => setPreviewKey(key)}
      />
      <PreviewModal storageKey={previewKey} onClose={() => setPreviewKey(null)} />

      <ModalWrapper visible={statusModal} onClose={() => setStatusModal(false)}>
        <View style={{padding: spacing.md}}>
          {allStatuses.map(s => (
            <OptionItem
              key={s}
              text={s}
              onPress={() => toggleStatus(s)}
              selected={status.includes(s)}
            />
          ))}
          <Button text="Done" onPress={() => setStatusModal(false)} />
        </View>
      </ModalWrapper>

      <ModalWrapper visible={typeModal} onClose={() => setTypeModal(false)}>
        <View style={{padding: spacing.md}}>
          {allTypes.map(t => (
            <OptionItem
              key={t}
              text={t}
              onPress={() => toggleType(t)}
              selected={jobType.includes(t)}
            />
          ))}
          <Button text="Done" onPress={() => setTypeModal(false)} />
        </View>
      </ModalWrapper>
    </ScreenLayout>
  );
};

export default WorkerTasksScreen;