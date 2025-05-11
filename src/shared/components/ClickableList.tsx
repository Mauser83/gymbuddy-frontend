// components/ClickableList.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useTheme} from 'shared/theme/ThemeProvider';

type Item = {
  id: string | number;
  label: string;
  onPress: () => void;
  subLabel?: string;
  rightElement?: React.ReactNode;
};

type Props = {
  items: Item[];
};

const ClickableList = ({ items }: Props) => {
  const { theme } = useTheme();

  return (
    <View>
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={item.onPress}
          style={styles.item}
        >
          <View style={styles.row}>
            <View style={styles.textContainer}>
              <Text
                style={[styles.label, { color: theme.colors.textPrimary }]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
              {item.subLabel ? (
                <Text
                  style={[styles.subLabel, { color: theme.colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {item.subLabel}
                </Text>
              ) : null}
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
});

export default ClickableList;
