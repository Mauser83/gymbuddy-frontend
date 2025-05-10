// Card.tsx
import React from 'react';
import {View, Text, ViewStyle, StyleProp} from 'react-native';
import {useTheme} from 'shared/theme/ThemeProvider';
import {spacing} from 'shared/theme/tokens';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

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
  style
}: CardProps) => {
  const {theme, componentStyles} = useTheme();
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
    <View style={[baseStyle, compactStyle, style]}>
      {children ? (
        <View>{children}</View>
      ) : (
        <>
          <Text style={styles[`${cardVariant}Title`]}>{title}</Text>
          {text ? (
            <Text style={styles[`${cardVariant}Text`]}>{text}</Text>
          ) : null}
        </>
      )}

      {showChevron && (
        <View
          style={{
            position: 'absolute',
            right: spacing.lg,
            top: '50%',
            transform: [{translateY: -8}],
          }}>
          <FontAwesome
            name="chevron-right"
            size={16}
            color={theme.colors.accentStart}
          />
        </View>
      )}
    </View>
  );
};

export default Card;
