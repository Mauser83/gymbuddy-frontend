import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useTheme} from 'shared/theme/ThemeProvider';
import { Pressable } from 'react-native';

interface Props {
  label: string;
  onPress?: () => void;
  onLongPress?: () => void;
  subLabel?: string;
  rightElement?: React.ReactNode;
  selected?: Boolean;
  disabled?: boolean; // ✅ new
}

export default function ClickableListItem({
  label,
  onPress,
  onLongPress,
  subLabel,
  rightElement,
  selected,
  disabled
}: Props) {
  const {theme} = useTheme();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.item, disabled && {opacity: 0.5}]}
      disabled={disabled || !onPress}>
      <View style={styles.row}>
        <View style={styles.textContainer}>
          {typeof label === 'string' || typeof label === 'number' ? (
            <Text style={[styles.label, {color: theme.colors.textPrimary}]}>
              {label}
            </Text>
          ) : null}
          {typeof subLabel === 'string' || typeof subLabel === 'number' ? (
            <Text
              style={[styles.subLabel, {color: theme.colors.textSecondary}]}>
              {subLabel}
            </Text>
          ) : null}
        </View>
        {rightElement === false
          ? null
          : (rightElement ?? (
              <FontAwesome
                name="chevron-right"
                size={16}
                color={theme.colors.accentStart}
              />
            ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
    item: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  subLabel: {
    fontSize: 14,
    marginTop: 2,
  },
});
