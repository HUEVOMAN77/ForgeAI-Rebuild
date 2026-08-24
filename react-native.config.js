module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./src/assets/fonts'],
  dependencies: {
    // Firebase App Check requires a private Firebase project configuration.
    // ForgeAI's public/offline distribution has no such configuration, so
    // exclude these optional native modules to prevent a startup crash.
    '@react-native-firebase/app': {
      platforms: {
        android: null,
        ios: null,
      },
    },
    '@react-native-firebase/app-check': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
