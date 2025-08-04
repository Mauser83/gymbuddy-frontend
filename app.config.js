import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  ios: {
    bundleIdentifier: "com.mauser83.gymbuddy",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: "com.mauser83.gymbuddy",
  },
  extra: {
    apiUrl: process.env.API_URL,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    eas: {
      projectId: "75740163-0d0d-4d46-9fad-2f76224d960c",
    },
  },
});