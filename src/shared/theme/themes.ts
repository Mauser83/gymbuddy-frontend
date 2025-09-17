import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

import { spacing, fontSizes, fontWeights, borderRadius, borderWidth } from './tokens';
import { Theme } from './types/theme.types';

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
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    } as ViewStyle,
  },
  card: StyleSheet.create({
    elevated: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.lg,
      elevation: 3,
      marginBottom: spacing.xl,
      padding: spacing.xl,
      shadowColor: theme.mode === 'dark' ? '#000' : '#aaa',
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    elevatedText: {
      color: theme.colors.textSecondary,
      fontSize: fontSizes.md,
      textAlign: 'center',
    },
    elevatedTitle: {
      color: theme.colors.textPrimary,
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.bold,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    feature: {
      backgroundColor: theme.colors.featureCardBackground,
      borderColor: theme.colors.cardBorder,
      borderRadius: borderRadius.lg,
      borderWidth: borderWidth.hairline,
      marginBottom: spacing.md,
      padding: spacing.md,
      width: '100%',
    },
    featureText: {
      color: theme.colors.textSecondary,
      fontSize: fontSizes.sm,
    },
    featureTitle: {
      color: theme.colors.textPrimary,
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.semiBold,
      marginBottom: spacing.xs,
    },
    glass: {
      backgroundColor: theme.colors.glass.background,
      borderColor: theme.colors.glass.border,
      borderRadius: borderRadius.lg,
      borderWidth: borderWidth.hairline,
      marginBottom: spacing.xl,
      padding: spacing.xl,
      // alignItems: 'center',
    },
    glassText: {
      color: theme.colors.textSecondary,
      fontSize: fontSizes.md,
      textAlign: 'center',
    },
    glassTitle: {
      color: theme.colors.textPrimary,
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.bold,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    solid: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.xl,
      padding: spacing.xl,
    },
    solidText: {
      color: theme.colors.textSecondary,
      fontSize: fontSizes.md,
      textAlign: 'center',
    },
    solidTitle: {
      color: theme.colors.textPrimary,
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.bold,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    user: {
      backgroundColor: theme.colors.glass.background,
      borderColor: theme.colors.cardBorder,
      borderRadius: borderRadius.lg,
      borderWidth: borderWidth.hairline,
      marginBottom: spacing.sm,
      padding: spacing.md,
    },
    userText: {
      color: theme.colors.textSecondary,
      fontSize: fontSizes.sm,
      marginTop: spacing.xs,
    },
    userTitle: {
      color: theme.colors.textPrimary,
      fontSize: fontSizes.md,
      fontWeight: fontWeights.semiBold,
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
      marginBottom: spacing.xs,
    },
  },
  button: StyleSheet.create({
    content: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
      justifyContent: 'center',
    },
    disabled: {
      backgroundColor: theme.colors.disabledSurface,
    },
    disabledText: {
      color: theme.colors.textDisabled,
    },
    gradient: {
      borderRadius: borderRadius.md,
      padding: spacing.md,
    },
    icon: {
      marginRight: spacing.sm,
    },
    outlineText: {
      color: theme.colors.textSecondary,
      fontSize: fontSizes.md,
      fontWeight: fontWeights.semiBold as TextStyle['fontWeight'],
    },
    outlineWrapper: {
      alignItems: 'center' as ViewStyle['alignItems'],
      borderColor: theme.colors.textSecondary,
      borderRadius: borderRadius.md,
      borderWidth: borderWidth.hairline,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    text: {
      color: theme.colors.buttonText,
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.semiBold,
      textAlign: 'center',
    },
    wrapper: {
      borderRadius: borderRadius.md,
      flex: 1,
    },
  }),
  formInput: StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    errorField: {
      borderColor: theme.colors.error,
    },
    errorMessage: {
      color: theme.colors.error,
      fontSize: fontSizes.sm,
      marginTop: spacing.xs,
    },
    field: {
      backgroundColor: theme.colors.glass.background,
      borderColor: theme.colors.layoutBorder,
      borderRadius: borderRadius.md,
      borderWidth: borderWidth.hairline,
      color: theme.colors.textPrimary,
      padding: spacing.md,
    },
    label: {
      color: theme.colors.textSecondary,
      fontSize: fontSizes.md,
      marginBottom: spacing.xs,
    },
  }),
  divider: StyleSheet.create({
    container: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      marginVertical: spacing.lg,
      width: '100%',
    },
    label: {
      color: theme.colors.textSecondary,
      fontSize: fontSizes.md,
      marginHorizontal: spacing.md,
      textAlign: 'center',
    },
    line: {
      backgroundColor: theme.colors.divider,
      flex: 1,
      height: 1, // fallback
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
    // container: {
    //   flex: 1,
    //   justifyContent: 'center' as ViewStyle['justifyContent'],
    //   alignItems: 'center' as ViewStyle['alignItems'],
    // },
    card: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: borderWidth.hairline,
      borderRadius: borderRadius.xl,
      padding: spacing.xl,
      maxHeight: '90%',
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
    container: {},
    title: {
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.bold,
      color: theme.colors.textPrimary,
      marginBottom: spacing.md,
    },
    subtitle: {
      fontSize: fontSizes.lg,
      color: theme.colors.textSecondary,
      marginBottom: spacing.md,
    },
  },
  optionItem: {
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
  },
  avatarDropdown: {
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: borderWidth.thick,
      borderColor: theme.colors.accentStart + '4D', // 30% opacity
    },
    dropdown: {
      position: 'absolute' as ViewStyle['position'],
      right: spacing.md,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.accentStart,
      borderWidth: borderWidth.hairline,
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.sm,
      width: 160,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 5,
    },
    item: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    text: {
      color: theme.colors.textPrimary,
      fontSize: fontSizes.md,
    },
  },
  footer: {
    container: {
      flexDirection: 'row' as ViewStyle['flexDirection'],
      alignItems: 'center' as ViewStyle['alignItems'],
      paddingVertical: spacing.md,
    },
    authContainer: {
      justifyContent: 'space-around' as ViewStyle['justifyContent'],
      paddingHorizontal: 0,
    },
    guestContainer: {
      justifyContent: 'flex-start' as ViewStyle['justifyContent'],
      paddingHorizontal: 33,
      gap: 32,
    },
    iconWrapper: {
      position: 'relative' as ViewStyle['position'],
    },
    badge: {
      position: 'absolute' as ViewStyle['position'],
      top: -6,
      right: -10,
      backgroundColor: theme.colors.error,
      borderRadius: 999,
      paddingVertical: 2,
      paddingHorizontal: 6,
    },
    badgeText: {
      color: theme.colors.buttonText,
      fontSize: 12,
      fontWeight: fontWeights.bold,
    },
    iconLabel: {
      fontSize: 10,
      marginTop: 2,
      textAlign: 'center' as TextStyle['textAlign'],
      color: theme.colors.textSecondary,
    },
  },
  gymsScreen: {
    createButtonContainer: {
      position: 'relative' as ViewStyle['position'],
      marginBottom: spacing.sm,
    },
  },
  gymDetail: {
    fieldTitle: {
      fontSize: fontSizes.sm,
      color: theme.colors.textSecondary,
      fontWeight: fontWeights.regular,
    },
  },
  noResults: {
    container: {
      marginTop: spacing.xl,
      alignItems: 'center' as ViewStyle['alignItems'],
    },
    text: {
      color: theme.colors.textSecondary,
      fontSize: fontSizes.md,
      textAlign: 'center' as TextStyle['textAlign'],
    },
  },
  loadingState: {
    container: {
      alignItems: 'center' as ViewStyle['alignItems'],
      justifyContent: 'center' as ViewStyle['justifyContent'],
      marginTop: spacing.lg,
    },
    text: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.semiBold,
      color: theme.colors.textPrimary,
      marginBottom: spacing.md,
      textAlign: 'center' as TextStyle['textAlign'],
    },
    spinner: {
      marginTop: spacing.xs,
    },
  },
  errorMessage: {
    text: {
      color: theme.colors.error,
      fontSize: fontSizes.md,
      textAlign: 'center' as TextStyle['textAlign'],
      marginTop: spacing.lg,
    },
  },
  searchInput: {
    searchContainer: {
      position: 'relative' as ViewStyle['position'],
      marginBottom: spacing.sm,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.cardBorder,
      borderWidth: borderWidth.hairline,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      paddingLeft: spacing.md,
      paddingRight: 40,
      color: theme.colors.textPrimary,
    },
    clearButton: {
      position: 'absolute' as ViewStyle['position'],
      right: 12,
      top: 11,
      height: 24,
      width: 24,
      borderRadius: 12,
      justifyContent: 'center' as ViewStyle['justifyContent'],
      alignItems: 'center' as ViewStyle['alignItems'],
      backgroundColor: theme.colors.error,
    },
    clearButtonText: {
      color: theme.colors.buttonText,
      fontWeight: fontWeights.bold,
    },
  },
  clickableList: {
    item: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.sm,
    },
    row: {
      flexDirection: 'row' as ViewStyle['flexDirection'],
      alignItems: 'center' as ViewStyle['alignItems'],
      justifyContent: 'space-between' as ViewStyle['justifyContent'],
    },
    textContainer: {
      flex: 1,
      marginRight: spacing.sm,
    },
    label: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.semiBold,
    },
    subLabel: {
      fontSize: fontSizes.sm,
      marginTop: 2,
    },
  },
});
