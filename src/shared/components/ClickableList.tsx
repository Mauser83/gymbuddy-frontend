// components/ClickableList.tsx
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useTheme} from 'shared/theme/ThemeProvider';
import { borderWidth } from 'shared/theme/tokens';

type Item = {
  id: string | number;
  label: string;
  onPress: () => void;
  subLabel?: string;
  rightElement?: React.ReactNode;
  content?: React.ReactNode;
  selected?: Boolean;
};

type Props = {
  items: Item[];
};

const ClickableList = ({items}: Props) => {
  const {theme} = useTheme();

  return (
    <View>
      {items.map(item => (
        <View key={item.id} style={[item.selected && {borderWidth: borderWidth.thick, borderColor: theme.colors.accentStart, borderRadius: 12}]}>
          <Pressable onPress={item.onPress} style={styles.item}>
            <View style={styles.row}>
              <View style={styles.textContainer}>
                <Text style={[styles.label, {color: theme.colors.textPrimary}]}>
                  {item.label}
                </Text>
                {item.subLabel && (
                  <Text
                    style={[
                      styles.subLabel,
                      {color: theme.colors.textSecondary},
                    ]}>
                    {item.subLabel}
                  </Text>
                )}
              </View>
                {item.rightElement ?? (
                  <FontAwesome
                    name="chevron-right"
                    size={16}
                    color={theme.colors.accentStart}
                  />
                )}
            </View>
          </Pressable>
          {item.content && (
            <View style={styles.expandedContent}>{item.content}</View>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  expandedContent: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
});

export default ClickableList;
