import { useMutation } from '@apollo/client';
import React, { useState } from 'react';
import { View, Platform, Alert } from 'react-native';

import ErrorPanel from 'src/features/worker-tasks/components/ErrorPanel';
import PreviewModal from 'src/features/worker-tasks/components/PreviewModal';
import QueueTable from 'src/features/worker-tasks/components/QueueTable';
import { RUN_IMAGE_WORKER_ONCE } from 'src/features/worker-tasks/graphql/queue.graphql';
import { useImageQueue } from 'src/features/worker-tasks/hooks/useImageQueue';
import { ImageJobStatus, ImageJobType } from 'src/features/worker-tasks/types';
import Button from 'src/shared/components/Button';
import Card from 'src/shared/components/Card';
import ErrorMessage from 'src/shared/components/ErrorMessage';
import ModalWrapper from 'src/shared/components/ModalWrapper';
import OptionItem from 'src/shared/components/OptionItem';
import ScreenLayout from 'src/shared/components/ScreenLayout';
import SearchInput from 'src/shared/components/SearchInput';
import SelectableField from 'src/shared/components/SelectableField';
import Title from 'src/shared/components/Title';
import { spacing } from 'src/shared/theme/tokens';

const allStatuses: ImageJobStatus[] = ['pending', 'processing', 'succeeded', 'failed'];
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
  const [status, setStatus] = useState<ImageJobStatus[]>(['pending', 'processing', 'failed']);
  const [jobType, setJobType] = useState<ImageJobType[]>(allTypes);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [autoRefreshOn, setAutoRefreshOn] = useState(true);
  const [statusModal, setStatusModal] = useState(false);
  const [typeModal, setTypeModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [preview, setPreview] = useState<{
    storageKey?: string;
    url?: string;
  } | null>(null);
  const [runOnce, { loading: processing, data: workerData, error: runError }] = useMutation(
    RUN_IMAGE_WORKER_ONCE,
    { errorPolicy: 'all' },
  );

  const { groups, thumbs, loading, refetch } = useImageQueue(
    {
      status,
      jobType,
      query: debouncedSearch,
      limit: 50,
    },
    { pollMs: autoRefreshOn ? 10000 : 0, pauseOnHidden: true },
  );

  // Aggregate occurred errors across all jobs (unique + readable)
  const occurredErrors = React.useMemo(() => {
    const set = new Set<string>();
    for (const g of groups) {
      for (const jt of ['hash', 'safety', 'embed'] as const) {
        const e = g.jobs[jt]?.lastError;
        if (e) set.add(`${jt.toUpperCase()}: ${e}`);
      }
    }
    return Array.from(set).join('\n\n');
  }, [groups]);

  const visibleGroups = React.useMemo(
    () => groups.filter((g) => Object.values(g.jobs).some((j) => j && j.status !== 'succeeded')),
    [groups],
  );

  const toggleStatus = (s: ImageJobStatus) => {
    setStatus((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const toggleType = (t: ImageJobType) => {
    setJobType((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  return (
    <ScreenLayout scroll>
      <Card variant="glass" compact>
        <Title text="Worker Tasks" subtitle="Background job controls" />
        <View
          style={{
            flexDirection: 'row',
            gap: spacing.xs,
            flexWrap: 'wrap',
            marginTop: spacing.sm,
          }}
        >
          <Button
            text={autoRefreshOn ? 'Auto On' : 'Auto Off'}
            onPress={() => setAutoRefreshOn(!autoRefreshOn)}
            small
          />
          <Button text="Refresh" onPress={() => refetch()} small />
          <Button
            text={showFilters ? 'Hide Filters' : 'Filters'}
            onPress={() => setShowFilters((s) => !s)}
            small
          />
          <Button
            text={processing ? 'Processing…' : 'Process Image Queue'}
            onPress={async () => {
              await runOnce({ variables: { max: 150 } });
              refetch();
            }}
            disabled={processing}
            small
          />
        </View>
        {showFilters && (
          <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
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
          </View>
        )}
      </Card>
      {/* Worker feedback */}
      {workerData?.runImageWorkerOnce?.status === 'already-running' && (
        <ErrorMessage message="Worker is already running a batch." />
      )}
      {runError && <ErrorMessage message="Failed to trigger worker" />}
      {!!occurredErrors && (
        <Card compact style={{ marginTop: spacing.sm }}>
          <ErrorPanel error={occurredErrors} />
        </Card>
      )}

      <QueueTable
        groups={visibleGroups}
        thumbs={thumbs}
        loading={loading}
        onOpenRaw={({ url, storageKey }) => {
          if (Platform.OS === 'web') {
            (globalThis as any).window?.open(url, '_blank', 'noopener,noreferrer');
            return;
          }
          if (storageKey) setPreview({ storageKey });
          else if (url) setPreview({ url });
          else Alert.alert('No preview available');
        }}
      />

      {Platform.OS !== 'web' && !!preview && (
        <PreviewModal
          storageKey={preview.storageKey ?? null}
          url={preview.url}
          onClose={() => setPreview(null)}
        />
      )}

      <ModalWrapper visible={statusModal} onClose={() => setStatusModal(false)}>
        <View style={{ padding: spacing.md }}>
          {allStatuses.map((s) => (
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
    </ScreenLayout>
  );
};

export default WorkerTasksScreen;
