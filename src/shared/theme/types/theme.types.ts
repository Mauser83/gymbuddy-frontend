export interface Theme {
    name: string;
    mode: 'light' | 'dark';
    colors: {
      background: string;
      surface: string;
      featureCardBackground: string;
      textPrimary: string;
      textSecondary: string;
      buttonText: string;
      error: string;
      divider: string;
      accentStart: string;
      accentEnd: string;
      cardBorder: string;
      rolePill: {
        app: string;
        user: string;
        gym: string;
      }
      glass: {
        background: string;
        border: string;
      };
    };
    components: {
      button: {
        variant: 'gradient' | 'solid';
      };
      card: {
        variant: 'glass' | 'solid';
      };
    };
  }
  