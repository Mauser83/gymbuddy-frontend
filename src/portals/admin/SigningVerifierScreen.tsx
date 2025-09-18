import { Picker } from '@react-native-picker/picker';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';

import { useExpiryTicker } from 'src/features/cv/hooks/useExpiryTicker';
import { useImageUrl } from 'src/features/cv/hooks/useImageUrl';
import Button from 'src/shared/components/Button';
import Card from 'src/shared/components/Card';
import ErrorMessage from 'src/shared/components/ErrorMessage';
import ScreenLayout from 'src/shared/components/ScreenLayout';
import Title from 'src/shared/components/Title';
import { useTheme } from 'src/shared/theme/ThemeProvider';

const TTL_OPTIONS = [60, 300, 600];
const HISTORY_KEY = 'signing_recent_keys';
const storage = (globalThis as any).localStorage as
  | { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void }
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
  const { theme } = useTheme();
  const [inputKey, setInputKey] = useState('');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [ttlSec, setTtlSec] = useState(300);
  const { url, expiresAt, loading, error, refetch } = useImageUrl(activeKey, ttlSec);
  const remaining = useExpiryTicker(expiresAt);
  const [status, setStatus] = useState<'IDLE' | 'LIVE' | 'EXPIRED' | '403'>('IDLE');
  const hasRefetched = useRef(false);
  const inputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (expiresAt) {
      setStatus('LIVE');
    }
  }, [expiresAt]);

  useEffect(() => {
    if (status === 'LIVE' && remaining <= 0) {
      setStatus('EXPIRED');
    }
  }, [remaining, status]);
  const [history, setHistory] = useState<string[]>(() => {
    if (!storage) return [];
    try {
      return JSON.parse(storage.getItem(HISTORY_KEY) || '[]') as string[];
    } catch {
      return [];
    }
  });

  const addHistory = useCallback((k: string) => {
    if (!storage) return;
    setHistory((prev) => {
      const arr = [k, ...prev.filter((h) => h !== k)].slice(0, 5);
      storage.setItem(HISTORY_KEY, JSON.stringify(arr));
      return arr;
    });
  }, []);

  const generate = () => {
    const k = inputKey.trim();
    if (!k) return;
    setActiveKey(k);
    addHistory(k);
    hasRefetched.current = false;
  };

  const handleImageError = useCallback(async () => {
    if (!url) return;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.status === 403) {
        setStatus('403');
        Toast.show({ type: 'error', text1: 'URL expired (403) — re-signing…' });
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
  }, [refetch, url]);

  const openInNewTab = useCallback(() => {
    if (url) (globalThis as any).open?.(url, '_blank');
  }, [url]);

  const copyUrl = useCallback(async () => {
    if (url) await Clipboard.setStringAsync(url);
  }, [url]);

  const copyKey = useCallback(async () => {
    if (activeKey) await Clipboard.setStringAsync(activeKey);
  }, [activeKey]);

  const reSign = useCallback(async () => {
    hasRefetched.current = false;
    try {
      await refetch();
      setStatus('LIVE');
    } catch (error) {
      console.error('Failed to re-sign image URL', error);
      setStatus('EXPIRED');
    }
  }, [refetch]);

  return (
    <ScreenLayout scroll>
      <Card variant="glass">
        <Title text="Signing Verifier" subtitle="Validate signatures" />
        <View style={styles.fieldRow}>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              { borderColor: theme.colors.divider, color: theme.colors.textPrimary },
            ]}
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
              onValueChange={(v) => {
                if (v) setInputKey(v);
              }}
            >
              <Picker.Item label="Recent" value={null} />
              {history.map((h) => (
                <Picker.Item key={h} label={h} value={h} />
              ))}
            </Picker>
          )}
        </View>
        <View style={styles.fieldRow}>
          <Text style={[styles.label, { color: theme.colors.textPrimary }]}>TTL</Text>
          <Picker
            selectedValue={ttlSec}
            style={styles.picker}
            onValueChange={(v) => setTtlSec(Number(v))}
          >
            {TTL_OPTIONS.map((o) => (
              <Picker.Item key={o} label={`${o}`} value={o} />
            ))}
          </Picker>
        </View>
        <View style={{ gap: 8 }}>
          <Button text="Generate URL" onPress={generate} disabled={loading} />
          <Button text="Re-sign" onPress={reSign} disabled={!activeKey} />
        </View>
        {error && <ErrorMessage message="Failed to sign" />}
        {url && (
          <View style={{ marginTop: 16, gap: 8 }}>
            <View style={styles.previewContainer}>
              <img
                src={url}
                alt="Signed image preview"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={handleImageError}
                referrerPolicy="no-referrer"
              />
            </View>
            <Text style={{ color: theme.colors.textPrimary }}>
              Expires in: {formatRemaining(remaining)}
            </Text>
            <Text style={{ color: theme.colors.textPrimary }}>Status: {status}</Text>
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
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  fieldRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  label: {
    fontWeight: '600',
  },
  picker: {
    height: 40,
    minWidth: 120,
  },
  previewContainer: {
    borderRadius: 8,
    maxHeight: 300,
    maxWidth: 300,
    overflow: 'hidden',
  },
});

export default SigningVerifierScreen;
