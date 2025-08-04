import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  ios: {
    bundleIdentifier: process.env.BUNDLE_IDENTIFIER,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: process.env.ANDROID_PACKAGE,
  },
  extra: {
    apiUrl: process.env.API_URL,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
});