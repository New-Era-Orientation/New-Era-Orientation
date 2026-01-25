import type { CapacitorConfig } from "@capacitor/cli";

// Set to true to bundle app locally, false to load from server
const useLocalBundle = false;

const config: CapacitorConfig = {
  appId: "vn.neoedu.app",
  appName: "NEO-EDU",
  webDir: useLocalBundle ? "out" : undefined,
  server: {
    // Load from remote server (recommended for dynamic content)
    ...(!useLocalBundle && {
      url: "https://neo-edu.vercel.app",
      cleartext: false,
    }),
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0a0a0a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      spinnerColor: "#00d9ff",
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#0a0a0a",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    scheme: "NEO-EDU",
  },
};

export default config;
