// components/ClickableList.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { useTheme } from 'shared/theme/ThemeProvider';
import { borderWidth } from 'shared/theme/tokens';

type Item = {
  id: string | number;
  label: string;
  onPress?: () => void;
  onLongPress?: () => void;
  subLabel?: string;
  rightElement?: React.ReactNode;
  content?: React.ReactNode;
  selected?: boolean;
  disabled?: boolean; // ✅ new
};

type Props = {
  items: Item[];
};

const ClickableList = ({ items }: Props) => {
  const { theme } = useTheme();

  return (
    <View>
      {items.map((item) => (
        <View
          key={item.id}
          style={
            item.selected && {
              borderWidth: borderWidth.thick,
              borderColor: theme.colors.accentStart,
              borderRadius: 12,
            }
          }
        >
          <Pressable
            onPress={item.onPress}
            onLongPress={item.onLongPress}
            style={[styles.item, item.disabled && { opacity: 0.5 }]}
            disabled={item.disabled || !item.onPress}
          >
            <View style={styles.row}>
              <View style={styles.textContainer}>
                {typeof item.label === 'string' || typeof item.label === 'number' ? (
                  <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
                    {item.label}
                  </Text>
                ) : null}
                {typeof item.subLabel === 'string' || typeof item.subLabel === 'number' ? (
                  <Text style={[styles.subLabel, { color: theme.colors.textSecondary }]}>
                    {item.subLabel}
                  </Text>
                ) : null}
              </View>
              {item.rightElement === false
                ? null
                : (item.rightElement ?? (
                    <FontAwesome name="chevron-right" size={16} color={theme.colors.accentStart} />
                  ))}
            </View>
          </Pressable>
          {item.content && <View style={styles.expandedContent}>{item.content}</View>}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  expandedContent: {
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  item: {
    borderRadius: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subLabel: {
    fontSize: 14,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
});

export default ClickableList;
