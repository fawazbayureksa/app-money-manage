/**
 * Expo App Configuration
 * This file replaces app.json to enable dynamic environment variable injection
 * Environment variables are injected during EAS builds based on the profile
 */

export default ({ config }) => {
  // Determine API URL based on build environment
  const API_URL = process.env.EXPO_PUBLIC_API_URL ||
    process.env.API_URL ||
    'http://34.158.34.129:8080/api';
  return {
    ...config,
    expo: {
      name: "Money Manage",
      slug: "money-manage",
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/images/icon.png",
      scheme: "moneymanage",
      userInterfaceStyle: "automatic",
      newArchEnabled: true,
      ios: {
        supportsTablet: true,
        bundleIdentifier: "com.fawazbayureksa.moneymanage",
        infoPlist: {
          ITSAppUsesNonExemptEncryption: false
        }
      },
      android: {
        adaptiveIcon: {
          backgroundColor: "#E6F4FE",
          foregroundImage: "./assets/images/android-icon-foreground.png",
          backgroundImage: "./assets/images/android-icon-background.png",
          monochromeImage: "./assets/images/android-icon-monochrome.png"
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
        package: "com.fawazbayureksa.moneymanage"
      },
      web: {
        output: "static",
        favicon: "./assets/images/favicon.png"
      },
      plugins: [
        "expo-router",
        [
          "expo-splash-screen",
          {
            image: "./assets/images/splash-icon.png",
            imageWidth: 200,
            resizeMode: "contain",
            backgroundColor: "#ffffff",
            dark: {
              backgroundColor: "#000000"
            }
          }
        ],
        [
          "expo-build-properties",
          {
            "android": {
              "usesCleartextTraffic": true
            }
          }
        ]
      ],
      experiments: {
        typedRoutes: true,
        reactCompiler: true
      },
      extra: {
        router: {},
        eas: {
          projectId: "a7878a9c-38dc-4e3b-88f5-4f12fe4d0dd5"
        },
        // Inject API URL into app at build time
        apiUrl: API_URL,
        buildProfile: process.env.EAS_BUILD_PROFILE || 'local'
      },
      owner: "fawazbayureksa"
    }
  };
};
