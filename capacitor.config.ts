import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "vn.neoedu.app",
  appName: "NEO-EDU",
  webDir: "out",
  server: {
    // Production: comment out for standalone app
    // url: "https://neo-edu.vercel.app",
    // cleartext: true,
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
