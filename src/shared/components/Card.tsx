// Card.tsx
import React from 'react';
import { View, Text, ViewStyle, StyleProp } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { useTheme } from 'src/shared/theme/ThemeProvider';
import { spacing } from 'src/shared/theme/tokens';

type CardVariant = 'glass' | 'solid' | 'elevated' | 'feature' | 'user';

interface CardProps {
  title?: string;
  text?: string;
  variant?: CardVariant;
  compact?: boolean;
  children?: React.ReactNode;
  showChevron?: boolean;
  style?: StyleProp<ViewStyle>;
}

const Card = ({
  title,
  text,
  variant,
  compact = false,
  children,
  showChevron,
  style,
}: CardProps) => {
  const { theme, componentStyles } = useTheme();
  const cardVariant = variant ?? theme.components.card.variant;
  const styles = componentStyles.card;

  const baseStyle = styles[cardVariant];
  const compactStyle = compact
    ? {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
      }
    : {};

  return (
    <View
      style={[
        baseStyle,
        compactStyle,
        style,
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        {children ? (
          <View>{children}</View>
        ) : (
          <>
            <Text style={styles[`${cardVariant}Title`]}>{title}</Text>
            {text ? <Text style={styles[`${cardVariant}Text`]}>{text}</Text> : null}
          </>
        )}
      </View>

      {showChevron && (
        <FontAwesome
          name="chevron-right"
          size={16}
          color={theme.colors.accentStart}
          style={{ marginLeft: spacing.lg, alignSelf: 'center' }}
        />
      )}
    </View>
  );
};

export default Card;
