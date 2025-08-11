// app.config.js
import 'dotenv/config';

export default ({config}) => {
  const env = (process.env.APP_ENV ?? 'production').toLowerCase();
  const isCvDev = env === 'cvdev';

  return {
    // keep anything you already had in app.json/app.config.*:
    ...config,

    // Make it obvious which app this is on the device & in TestFlight
    name: isCvDev ? 'GymBuddy Dev' : (config.name ?? 'GymBuddy'),
    slug: isCvDev ? 'gymbuddy-dev' : (config.slug ?? 'gymbuddy'),
    scheme: isCvDev ? 'gymbuddydev' : 'gymbuddy',
    // (optional) icons/badges:
    icon: isCvDev ? './assets/icon-dev.png' : './assets/icon.png',

    ios: {
      ...(config.ios ?? {}),
      // <-- NEW: separate bundle id so it installs side-by-side
      bundleIdentifier: isCvDev
        ? 'com.mauser83.gymbuddy.dev'
        : 'com.mauser83.gymbuddy',
      infoPlist: {
        ...(config.ios?.infoPlist ?? {}),
        ITSAppUsesNonExemptEncryption: false,
        CFBundleDisplayName: isCvDev ? 'GymBuddy Dev' : 'GymBuddy', // explicit
      },
    },

    android: {
      ...(config.android ?? {}),
      // keep Android aligned (helps when you later ship to Play)
      package: isCvDev ? 'com.mauser83.gymbuddy.dev' : 'com.mauser83.gymbuddy',
    },

    extra: {
      ...(config.extra ?? {}),
      stage: env,
      // prefer EXPO_PUBLIC_* from your EAS profile, fall back to local API_URL
      apiUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? process.env.API_URL,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      eas: {
        projectId: '75740163-0d0d-4d46-9fad-2f76224d960c',
      },
    },
  };
};
