const { withGradleProperties } = require('@expo/config-plugins');

const withIncreasedGradleMemory = (config) =>
  withGradleProperties(config, (config) => {
    const jvmArgsProp = config.modResults.find(
      (item) => item.type === 'property' && item.key === 'org.gradle.jvmargs'
    );
    if (jvmArgsProp) {
      jvmArgsProp.value = '-Xmx4096m -XX:MaxMetaspaceSize=1024m';
    } else {
      config.modResults.push({
        type: 'property',
        key: 'org.gradle.jvmargs',
        value: '-Xmx4096m -XX:MaxMetaspaceSize=1024m',
      });
    }
    return config;
  });

export default {
  expo: {
    name: 'Aashray',
    scheme: 'aashray',
    slug: 'aashray',
    version: '1.1.53',
    orientation: 'portrait',
    icon: './src/assets/images/icon.png',
    userInterfaceStyle: 'automatic',
    assetBundlePatterns: ['**/*'],
    updates: {
      enabled: true,
      fallbackToCacheTimeout: 0,
    },
    runtimeVersion: {
      policy: 'sdkVersion',
    },
    ios: {
      icon: './src/assets/images/icon.icon',
      supportsTablet: true,
      package: 'org.vitraagvigyaan.aashray',
      bundleIdentifier: 'org.vitraagvigyaan.aashray',
      associatedDomains: ['applinks:aashray.vitraagvigyaan.org'],
      googleServicesFile: process.env.GOOGLE_SERVICES_PLIST,
      infoPlist: {
        LSApplicationQueriesSchemes: ['tez', 'phonepe', 'paytmmp'],
        NSCameraUsageDescription:
          'We need your images so that our guruji can view it before meetings.',
        NSPhotoLibraryUsageDescription:
          'We need access to your photo library so you can select photos for our guruji to view before meetings.',
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: 'org.vitraagvigyaan.aashray',
      // Photo selection uses the Android system photo picker (expo-image-picker's
      // PickVisualMedia), which needs no broad media access. Block these so a
      // transitive manifest merge can never re-introduce them and trip the
      // Google Play "one-time/infrequent photo use" policy.
      blockedPermissions: [
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_MEDIA_VIDEO',
      ],
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: true,
      adaptiveIcon: {
        foregroundImage: './src/assets/images/adaptive-icon.png',
        monochromeImage: './src/assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: 'aashray.vitraagvigyaan.org',
              pathPrefix: '/adhyayan',
            },
            {
              scheme: 'https',
              host: 'aashray.vitraagvigyaan.org',
              pathPrefix: '/adhyayan/feedback',
            },
            {
              scheme: 'https',
              host: 'aashray.vitraagvigyaan.org',
              pathPrefix: '/utsav',
            },
            {
              scheme: 'https',
              host: 'aashray.vitraagvigyaan.org',
              pathPrefix: '/utsav/feedback',
            },
            {
              scheme: 'https',
              host: 'aashray.vitraagvigyaan.org',
              pathPrefix: '/event',
            },
            {
              scheme: 'https',
              host: 'aashray.vitraagvigyaan.org',
              pathPrefix: '/wifi',
            },
            {
              scheme: 'https',
              host: 'aashray.vitraagvigyaan.org',
              pathPrefix: '/menu',
            },
            {
              scheme: 'https',
              host: 'aashray.vitraagvigyaan.org',
              pathPrefix: '/maintenanceRequestList',
            },
            {
              scheme: 'https',
              host: 'aashray.vitraagvigyaan.org',
              pathPrefix: '/pendingPayments',
            },
            {
              scheme: 'https',
              host: 'aashray.vitraagvigyaan.org',
              pathPrefix: '/bookings',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        {
          action: 'VIEW',
          data: [
            {
              scheme: 'aashray',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    plugins: [
      [
        'expo-router',
        {
          origin: 'https://aashray.vitraagvigyaan.org',
        },
      ],
      '@react-native-firebase/app',
      [
        'expo-build-properties',
        {
          android: {
            minSdkVersion: 26,
          },
          ios: {
            useFrameworks: 'static',
            buildReactNativeFromSource: true,
            extraPods: [
              { name: 'razorpay-pod', version: '1.5.3' },
              { name: 'FirebaseCoreInternal', modular_headers: true },
              { name: 'GoogleUtilities', modular_headers: true }
            ],
          },
        },
      ],
      [
        '@sentry/react-native/expo',
        {
          url: 'https://sentry.io/',
          project: 'react-native',
          organization: 'vendz',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './src/assets/images/logo.png',
          enableBackgroundRemoteNotifications: true,
        },
      ],
      [
        'expo-splash-screen',
        {
          backgroundColor: '#ffffff',
          image: './src/assets/images/logo.png',
          dark: {
            image: './src/assets/images/logo.png',
            backgroundColor: '#000000',
          },
          imageWidth: 200,
        },
      ],
      [
        'react-native-edge-to-edge',
        {
          android: {
            parentTheme: 'Material2',
            enforceNavigationBarContrast: false,
          },
        },
      ],
      'expo-font',
      withIncreasedGradleMemory,
    ],
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: 'c4c70213-3142-47aa-b3b1-2fbedc8bfaad',
      },
    },
    owner: 'vitraagvigyaan',
  },
  experiments: {
    buildCacheProvider: 'eas',
    reactCompiler: true,
  },
};
