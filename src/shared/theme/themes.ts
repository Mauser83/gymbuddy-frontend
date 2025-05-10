import {StyleSheet, ViewStyle, TextStyle} from 'react-native';
import {Theme} from './types/theme.types';
import {
  spacing,
  fontSizes,
  fontWeights,
  borderRadius,
  borderWidth,
} from './tokens';

export const getComponentStyles = (theme: Theme) => ({
  screenLayout: {
    container: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
    } as ViewStyle,

    centeredContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    } as ViewStyle,
  },
  card: StyleSheet.create({
    glass: {
      backgroundColor: theme.colors.glass.background,
      borderColor: theme.colors.glass.border,
      borderWidth: borderWidth.hairline,
      borderRadius: borderRadius.lg,
      padding: spacing.xl,
      marginBottom: spacing.xl,
      alignItems: 'center',
    },
    glassTitle: {
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.bold,
      color: theme.colors.textPrimary,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    glassText: {
      fontSize: fontSizes.md,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    solid: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.xl,
      marginBottom: spacing.xl,
    },
    solidTitle: {
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.bold,
      color: theme.colors.textPrimary,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    solidText: {
      fontSize: fontSizes.md,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    elevated: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.xl,
      marginBottom: spacing.xl,
      shadowColor: theme.mode === 'dark' ? '#000' : '#aaa',
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    elevatedTitle: {
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.bold,
      color: theme.colors.textPrimary,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    elevatedText: {
      fontSize: fontSizes.md,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    feature: {
      width: '100%',
      backgroundColor: theme.colors.featureCardBackground,
      borderColor: theme.colors.cardBorder,
      borderWidth: borderWidth.hairline,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    featureTitle: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.semiBold,
      color: theme.colors.textPrimary,
      marginBottom: spacing.xs,
    },
    featureText: {
      fontSize: fontSizes.sm,
      color: theme.colors.textSecondary,
    },
    user: {
      borderWidth: borderWidth.hairline,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      backgroundColor: theme.colors.glass.background,
      borderColor: theme.colors.cardBorder,
    },
    userTitle: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.semiBold,
      color: theme.colors.textPrimary,
    },
    userText: {
      fontSize: fontSizes.sm,
      color: theme.colors.textSecondary,
      marginTop: spacing.xs,
    },
  }),
  detailField: {
    label: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.regular, // Cast if needed
      color: theme.colors.textSecondary,
      marginBottom: spacing.xs,
    },
    value: {
      fontSize: fontSizes.md,
      color: theme.colors.textPrimary,
      marginBottom: spacing.sm,
    },
  },
  button: StyleSheet.create({
    wrapper: {
      flex: 1,
      borderRadius: borderRadius.md,
    },
    gradient: {
      borderRadius: borderRadius.md,
      padding: spacing.md,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    text: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.semiBold,
      color: theme.colors.buttonText,
      textAlign: 'center',
    },
    icon: {
      marginRight: spacing.sm,
    },
    outlineWrapper: {
      borderWidth: borderWidth.hairline,
      borderColor: theme.colors.textSecondary,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      alignItems: 'center' as ViewStyle['alignItems'],
    },
    outlineText: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.semiBold as TextStyle['fontWeight'],
      color: theme.colors.textSecondary,
    },
    disabled: {
      backgroundColor: theme.colors.disabledSurface,
    },
    disabledText: {
      color: theme.colors.textDisabled,
    },
  }),
  input: StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    label: {
      color: theme.colors.textSecondary,
      fontSize: fontSizes.md,
      marginBottom: spacing.xs,
    },
    field: {
      backgroundColor: theme.colors.glass.background,
      color: theme.colors.textPrimary,
      borderWidth: borderWidth.hairline,
      borderColor: 'rgba(255, 165, 0, 0.2)',
      borderRadius: borderRadius.md,
      padding: spacing.md,
    },
    errorField: {
      borderColor: theme.colors.error,
    },
    errorMessage: {
      color: theme.colors.error,
      fontSize: fontSizes.sm,
      marginTop: spacing.xs,
    },
  }),
  divider: StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: spacing.lg,
      width: '100%',
    },
    line: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.divider ?? 'rgba(255, 255, 255, 0.2)', // fallback
    },
    label: {
      marginHorizontal: spacing.md,
      fontSize: fontSizes.md,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  }),
  rolePill: {
    container: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      alignSelf: 'flex-start' as ViewStyle['alignSelf'],
      marginBottom: spacing.sm,
      marginTop: spacing.xs,
    },
    text: {
      color: 'white',
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.semiBold,
    },
  },
  rolePillExpandable: {
    container: {
      flexDirection: 'row' as ViewStyle['flexDirection'],
      alignItems: 'center' as ViewStyle['alignItems'],
      justifyContent: 'space-between' as ViewStyle['justifyContent'],
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      marginBottom: spacing.sm,
      marginTop: spacing.xs,
    },
    text: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.semiBold,
    },
    icon: {
      fontSize: fontSizes.sm,
      marginLeft: spacing.sm,
    },
  },
  collapsibleList: {
    title: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.regular,
      color: theme.colors.textSecondary,
      marginBottom: spacing.xs,
    },
    item: {
      fontSize: fontSizes.sm,
      color: theme.colors.textPrimary,
      marginBottom: spacing.xs,
    },
    toggle: {
      fontSize: fontSizes.sm,
      color: theme.colors.accentStart,
    },
    toggleCollapse: {
      fontSize: fontSizes.sm,
      color: theme.colors.accentEnd,
    },
    container: {
      marginTop: spacing.md,
    },
  },
  gymRoleEntry: {
    container: {
      flexDirection: 'row' as ViewStyle['flexDirection'],
      justifyContent: 'space-between' as ViewStyle['justifyContent'],
      alignItems: 'center' as ViewStyle['alignItems'],
      marginBottom: spacing.xs,
    },
    gymName: {
      fontSize: fontSizes.sm,
      color: theme.colors.textPrimary,
      fontWeight: fontWeights.regular as TextStyle['fontWeight'],
    },
    role: {
      fontSize: fontSizes.sm,
      color: theme.colors.textSecondary,
      fontWeight: fontWeights.semiBold as TextStyle['fontWeight'],
      textTransform: 'uppercase' as TextStyle['textTransform'],
    },
  },
  modalWrapper: {
    container: {
      justifyContent: 'center' as ViewStyle['justifyContent'],
      alignItems: 'center' as ViewStyle['alignItems'],
    },
    card: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: borderWidth.hairline,
      borderRadius: borderRadius.xl,
      padding: spacing.xl,
      width: '90%' as ViewStyle['width'],
    } as ViewStyle,
  },
  selectableField: {
    field: {
      marginBottom: spacing.md,
    },
    label: {
      color: theme.colors.textSecondary,
      marginBottom: spacing.xs,
    },
    picker: {
      borderRadius: borderRadius.md,
      borderWidth: 1,
      padding: spacing.md,
      borderColor: theme.colors.cardBorder,
      backgroundColor: theme.colors.surface,
    },
    pickerDisabled: {
      backgroundColor: theme.colors.disabledSurface,
      borderColor: theme.colors.disabledBorder,
    },
    pickerText: {
      color: theme.colors.textPrimary,
    },
    pickerTextDisabled: {
      color: theme.colors.textDisabled,
    },
    pickerContent: {
      flexDirection: 'row' as ViewStyle['flexDirection'],
      alignItems: 'center' as ViewStyle['alignItems'],
      justifyContent: 'space-between' as ViewStyle['justifyContent'],
    },
  },
  title: {
    container: {
      marginBottom: spacing.md,
    },
    title: {
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.bold,
      color: theme.colors.textPrimary,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: fontSizes.lg,
      color: theme.colors.textSecondary,
    },
  },
  optionItem: {
    container: {
      paddingVertical: spacing.md,
      borderBottomColor: theme.colors.divider,
      borderBottomWidth: borderWidth.hairline,
    },
    text: {
      color: theme.colors.textPrimary,
      fontSize: fontSizes.md,
      textAlign: 'center' as TextStyle['textAlign'],
    },
  },
  safeAreaFooter: {
    container: {
      backgroundColor: theme.colors.surface,
      borderTopWidth: borderWidth.hairline,
      borderTopColor: theme.colors.layoutBorder,
    },
  },
  safeAreaHeader: {
    container: {
      backgroundColor: theme.colors.surface,
      borderBottomWidth: borderWidth.hairline,
      borderBottomColor: theme.colors.layoutBorder,
    },
  },
  header: {
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    flexDirection: 'row' as ViewStyle['flexDirection'],
    justifyContent: 'space-between' as ViewStyle['justifyContent'],
    alignItems: 'center' as ViewStyle['alignItems'],
    minHeight: 61,
  },
  left: {
    flexDirection: 'row' as ViewStyle['flexDirection'],
    alignItems: 'center' as ViewStyle['alignItems'],
  },
  title: {
    color: theme.colors.textPrimary,
    fontWeight: fontWeights.bold,
    fontSize: 18,
    marginLeft: spacing.sm,
  },
  right: {
    flexDirection: 'row' as ViewStyle['flexDirection'],
    alignItems: 'center' as ViewStyle['alignItems'],
  },
  notification: {
    marginRight: spacing.md,
    position: 'relative' as ViewStyle['position'],
  },
  dot: {
    position: 'absolute' as ViewStyle['position'],
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accentStart,
  },
  avatar: {
    position: 'relative' as ViewStyle['position'],
  },
}

});
