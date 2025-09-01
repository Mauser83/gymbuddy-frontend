import React from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import ScreenLayout from 'shared/components/ScreenLayout';
import Card from 'shared/components/Card';
import Title from 'shared/components/Title';
import Button from 'shared/components/Button';
import ErrorMessage from 'shared/components/ErrorMessage';
import useImageUrl from 'features/cv/hooks/useImageUrl';
import useExpiryTicker from 'features/cv/hooks/useExpiryTicker';
import {useTheme} from 'shared/theme/ThemeProvider';

const TTL_OPTIONS = [60, 300, 600];
const HISTORY_KEY = 'signing_recent_keys';
const storage = (globalThis as any).localStorage as
  | {getItem: (k: string) => string | null; setItem: (k: string, v: string) => void}
  | undefined;

function formatRemaining(sec: number) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

const SigningVerifierScreen = () => {
  const {theme} = useTheme();
  const [inputKey, setInputKey] = React.useState('');
  const [activeKey, setActiveKey] = React.useState<string | null>(null);
  const [ttlSec, setTtlSec] = React.useState(300);
  const {url, expiresAt, loading, error, refetch} = useImageUrl(activeKey, ttlSec);
  const remaining = useExpiryTicker(expiresAt);
  const [status, setStatus] = React.useState<'IDLE' | 'LIVE' | 'EXPIRED' | '403'>('IDLE');
  const hasRefetched = React.useRef(false);
  const inputRef = React.useRef<TextInput | null>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  React.useEffect(() => {
    if (expiresAt) {
      setStatus('LIVE');
    }
  }, [expiresAt]);

  React.useEffect(() => {
    if (status === 'LIVE' && remaining <= 0) {
      setStatus('EXPIRED');
    }
  }, [remaining, status]);

  const history = React.useMemo(() => {
    if (!storage) return [];
    try {
      return JSON.parse(storage.getItem(HISTORY_KEY) || '[]') as string[];
    } catch {
      return [];
    }
  }, [activeKey]);

  const addHistory = (k: string) => {
    if (!storage) return;
    const arr = [k, ...history.filter(h => h !== k)].slice(0, 5);
    storage.setItem(HISTORY_KEY, JSON.stringify(arr));
  };

  const generate = () => {
    const k = inputKey.trim();
    if (!k) return;
    setActiveKey(k);
    addHistory(k);
    hasRefetched.current = false;
  };

  const handleImageError = async () => {
    if (!url) return;
    try {
      const res = await fetch(url, {method: 'HEAD'});
      if (res.status === 403) {
        setStatus('403');
        Toast.show({type: 'error', text1: 'URL expired (403) — re-signing…'});
        if (!hasRefetched.current) {
          hasRefetched.current = true;
          try {
            await refetch();
            setStatus('LIVE');
          } catch {
            setStatus('EXPIRED');
          }
        }
      }
    } catch {
      setStatus('EXPIRED');
    }
  };

  const openInNewTab = () => {
    if (url) (globalThis as any).open?.(url, '_blank');
  };

  const copyUrl = async () => {
    if (url) await Clipboard.setStringAsync(url);
  };

  const copyKey = async () => {
    if (activeKey) await Clipboard.setStringAsync(activeKey);
  };

  const reSign = async () => {
    hasRefetched.current = false;
    try {
      await refetch();
      setStatus('LIVE');
    } catch {}
  };

  return (
    <ScreenLayout scroll>
      <Card variant="glass">
        <Title text="Signing Verifier" subtitle="Validate signatures" />
        <View style={styles.fieldRow}>
          <TextInput
            ref={inputRef}
            style={[styles.input, {borderColor: theme.colors.divider}]}
            value={inputKey}
            onChangeText={setInputKey}
            placeholder="storageKey"
            onSubmitEditing={generate}
          />
          <Button
            text="Paste"
            small
            onPress={async () => setInputKey(await Clipboard.getStringAsync())}
          />
          {history.length > 0 && (
            <Picker
              selectedValue={null}
              style={styles.picker}
              onValueChange={v => {
                if (v) setInputKey(v);
              }}>
              <Picker.Item label="Recent" value={null} />
              {history.map(h => (
                <Picker.Item key={h} label={h} value={h} />
              ))}
            </Picker>
          )}
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.label}>TTL</Text>
          <Picker
            selectedValue={ttlSec}
            style={styles.picker}
            onValueChange={v => setTtlSec(v)}>
            {TTL_OPTIONS.map(o => (
              <Picker.Item key={o} label={`${o}`} value={o} />
            ))}
          </Picker>
        </View>
        <View style={{gap: 8}}>
          <Button text="Generate URL" onPress={generate} disabled={loading} />
          <Button
            text="Re-sign"
            variant="outline"
            onPress={reSign}
            disabled={!activeKey}
          />
        </View>
        {error && <ErrorMessage message="Failed to sign" />}
        {url && (
          <View style={{marginTop: 16, gap: 8}}>
            <View style={styles.previewContainer}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <img
                src={url}
                style={{width: '100%', height: '100%', objectFit: 'contain'}}
                onError={handleImageError}
                referrerPolicy="no-referrer"
              />
            </View>
            <Text>Expires in: {formatRemaining(remaining)}</Text>
            <Text>Status: {status}</Text>
            <View style={styles.actionRow}>
              <Button text="Open in new tab" small onPress={openInNewTab} />
              <Button text="Copy URL" small onPress={copyUrl} />
              <Button text="Copy key" small onPress={copyKey} />
            </View>
          </View>
        )}
      </Card>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  picker: {
    height: 40,
    minWidth: 120,
  },
  label: {
    fontWeight: '600',
  },
  previewContainer: {
    maxWidth: 300,
    maxHeight: 300,
    overflow: 'hidden',
    borderRadius: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default SigningVerifierScreen;