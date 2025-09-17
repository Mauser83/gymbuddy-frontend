// app.config.js
import 'dotenv/config';

export default ({ config }) => {
  const env = (process.env.APP_ENV ?? 'production').toLowerCase();
  const isCvDev = env === 'cvdev';

  // Dynamically set the project ID based on the environment
  const projectId = isCvDev
    ? 'a40eb355-3df0-4508-85f6-ba2a56bb11ef'
    : '18503d49-68ad-4833-9d2b-82f28ee287b0'; // The correct projectId for GymBuddy

  return {
    // keep anything you already had in app.json/app.config.*:
    ...config,

    // Make it obvious which app this is on the device & in TestFlight
    name: isCvDev ? 'GymBuddy Dev' : 'GymBuddy',
    slug: isCvDev ? 'gymbuddy-dev' : 'gymbuddy',
    scheme: isCvDev ? 'gymbuddydev' : 'gymbuddy',
    // (optional) icons/badges:
    icon: isCvDev ? './assets/icon-dev.png' : './assets/icon.png',

    // ✅ Add (or merge) plugins
    plugins: [
      ...(config.plugins ?? []),
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow access to your photos to pick images for equipment recognition.',
          cameraPermission: 'Allow camera access to scan gym equipment.',
          // Include only if you capture video with audio:
          // microphonePermission: 'Allow microphone while recording videos.',
        },
      ],
      // If you SAVE to the photo library via expo-media-library, add its plugin too:
      // ['expo-media-library', { photosPermission: 'Allow saving images to your photo library.' }],
    ],

    ios: {
      ...(config.ios ?? {}),
      // <-- NEW: separate bundle id so it installs side-by-side
      bundleIdentifier: isCvDev ? 'com.mauser83.gymbuddy.dev' : 'com.mauser83.gymbuddy',
      infoPlist: {
        ...(config.ios?.infoPlist ?? {}),
        ITSAppUsesNonExemptEncryption: false,
        CFBundleDisplayName: isCvDev ? 'GymBuddy Dev' : 'GymBuddy', // explicit
        NSCameraUsageDescription: 'We use the camera to recognize gym equipment.',
        NSPhotoLibraryUsageDescription:
          'Allow photo library access to pick images for recognition.',
        NSPhotoLibraryAddUsageDescription: 'Allow saving recognized images to your photo library.',
        // NSMicrophoneUsageDescription:
        //   'We use the microphone when recording videos.',
      },
    },

    android: {
      ...(config.android ?? {}),
      // keep Android aligned (helps when you later ship to Play)
      package: isCvDev ? 'com.mauser83.gymbuddy.dev' : 'com.mauser83.gymbuddy',
    },

    extra: {
      ...(config.extra ?? {}),
      eas: {
        projectId: projectId, // The projectId is now set here, correctly
      },
      stage: env,
    },
  };
};
