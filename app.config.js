export default {
  ios: {
    bundleIdentifier: 'com.mauser83.gymbuddy',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.mauser83.gymbuddy',
  },
  extra: {
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    apiUrl: process.env.API_URL,
    eas: {
      projectId: '75740163-0d0d-4d46-9fad-2f76224d960c',
    },
  },
};
