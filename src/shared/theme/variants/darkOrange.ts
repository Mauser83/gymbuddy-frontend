import { Theme } from '../types/theme.types';

export const darkOrange: Theme = {
  name: 'dark-orange',
  mode: 'dark',
  colors: {
    background: '#0f172a',
    surface: '#1f2937',
    featureCardBackground: 'rgba(255, 255, 255, 0.03)',
    textPrimary: '#f9fafb',
    textSecondary: '#9ca3af',
    buttonText: '#ffffff',
    error: '#f87171',
    divider: 'rgba(255, 255, 255, 0.2)',
    accentStart: '#f97316',
    accentEnd: '#ef4444',
    cardBorder: 'rgba(255, 255, 255, 0.07)',
    rolePill: {
      app: '#ef4444',
      user: '#f97316',
      gym: '#eab308',
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(255, 255, 255, 0.1)',
    },
  },
  components: {
    button: {
      variant: 'gradient',
    },
    card: {
      variant: 'glass',
    },
  },
};
