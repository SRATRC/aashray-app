export default {
  expo: {
    name: 'Aashray',
    scheme: 'aashray',
    slug: 'aashray',
    version: '1.0.8',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    userInterfaceStyle: 'automatic',
    // splash: {
    //   image: './assets/images/splash.png',
    //   resizeMode: 'contain',
    //   backgroundColor: '#ffffff',
    // },
    assetBundlePatterns: ['**/*'],
    ios: {
      icon: {
        dark: './assets/images/ios-dark.png',
        light: './assets/images/icon.png',
      },
      supportsTablet: true,
      package: 'org.vitraagvigyaan.aashray',
      bundleIdentifier: 'org.vitraagvigyaan.aashray',
      googleServicesFile: process.env.GOOGLE_SERVICES_PLIST,
      infoPlist: {
        LSApplicationQueriesSchemes: ['tez', 'phonepe', 'paytmmp'],
        NSCameraUsageDescription:
          'We need your images so that our guruji can view it before meetings.',
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: 'org.vitraagvigyaan.aashray',
      edgeToEdgeEnabled: true,
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        monochromeImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
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
    // web: {
    //   favicon: './assets/favicon.png',
    // },
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
          cameraPermission:
            'Allow $(PRODUCT_NAME) to access your camera to capture a selfie so guruji can view it before meetings.',
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
      [
        'expo-splash-screen',
        {
          backgroundColor: '#ffffff',
          image: './assets/images/logo.png',
          dark: {
            image: './assets/images/logo.png',
            backgroundColor: '#000000',
          },
          imageWidth: 200,
        },
      ],
      [
        'expo-web-browser',
        {
          experimentalLauncherActivity: true,
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
