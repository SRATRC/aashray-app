export default {
  expo: {
    name: 'aashray',
    scheme: 'aashray',
    slug: 'aashray',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      package: 'org.vitraagvigyaan.aashray',
      bundleIdentifier: 'org.vitraagvigyaan.aashray',
      googleServicesFile: process.env.GOOGLE_SERVICES_PLIST,
      infoPlist: {
        LSApplicationQueriesSchemes: ['tez', 'phonepe', 'paytmmp'],
        NSCameraUsageDescription: 'This app requires camera access to allow you to take photos.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'org.vitraagvigyaan.aashray',
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
      intentFilters: [
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
    web: {
      favicon: './assets/favicon.png',
    },
    // updates: {
    //   enabled: true,
    //   checkAutomatically: 'ON_LOAD',
    //   fallbackToCacheTimeout: 0
    // },
    plugins: [
      'expo-router',
      '@react-native-firebase/app',
      [
        'expo-build-properties',
        {
          android: {
            minSdkVersion: 26,
            // enableProguardInReleaseBuilds: true,
            // proguardRules: [
            //   '-keepattributes *Annotation*',
            //   '-dontwarn com.razorpay.**',
            //   '-keep class com.razorpay.** { *; }',
            //   '-optimizations !method/inlining/',
            //   '-keepclasseswithmembers class * { public void onPayment*(...); }',
            // ],
            // minifyEnabled: true,
            // shrinkResources: true,
          },
          ios: {
            useFrameworks: 'static',
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
        'expo-camera',
        {
          cameraPermission: 'Allow $(PRODUCT_NAME) to access your camera',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/images/logo.png',
          // "color": "#ffffff",
          // "defaultChannel": "default",
          enableBackgroundRemoteNotifications: true,
        },
      ],
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
};
