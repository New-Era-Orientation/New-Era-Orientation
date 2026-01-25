# 📱 Build Mobile & Desktop Apps

Hướng dẫn build APK (Android), IPA (iOS), và MSIX (Windows) từ NEO-EDU.

## 🏗️ Kiến trúc

```
NEO-EDU/
├── src/                    # Next.js source (web)
├── out/                    # Static export (cho mobile)
├── android/                # Android project (Capacitor)
├── ios/                    # iOS project (Capacitor)  
├── src-tauri/              # Windows/macOS/Linux (Tauri)
├── capacitor.config.ts     # Capacitor config
└── tauri.conf.json         # Tauri config
```

---

## 📲 Mobile Apps (Capacitor)

### Prerequisites

```bash
# Node.js 22+
# Android Studio (for Android)
# Xcode (for iOS - macOS only)
# Java JDK 17+
```

### Setup Capacitor

```bash
# 1. Install Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios

# 2. Install plugins
npm install @capacitor/splash-screen @capacitor/status-bar
npm install @capacitor/keyboard @capacitor/push-notifications
npm install @capacitor/app @capacitor/haptics @capacitor/network

# 3. Initialize platforms
npx cap add android
npx cap add ios
```

### Build & Export

```bash
# 1. Export Next.js to static files
npm run build:static

# 2. Sync to native projects
npx cap sync

# 3. Open in IDE
npx cap open android  # Opens Android Studio
npx cap open ios      # Opens Xcode (macOS only)
```

### Build APK (Android)

```bash
# Debug APK
cd android
./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk

# Release APK (signed)
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk

# AAB for Play Store
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### Build IPA (iOS)

```bash
# macOS only!
cd ios/App
pod install

# Open Xcode
open App.xcworkspace

# In Xcode:
# 1. Select your Team in Signing & Capabilities
# 2. Product > Archive
# 3. Distribute App > Ad Hoc / App Store
```

---

## 🖥️ Desktop App (Tauri)

### Prerequisites

```bash
# Rust (https://rustup.rs)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Windows: Visual Studio Build Tools
# macOS: Xcode Command Line Tools
# Linux: build-essential, webkit2gtk
```

### Setup Tauri

```bash
# Install Tauri CLI
npm install -D @tauri-apps/cli @tauri-apps/api

# Initialize Tauri
npm run tauri init
```

### Build MSIX (Windows)

```bash
# Development
npm run tauri dev

# Build release
npm run tauri build

# Output locations:
# Windows: src-tauri/target/release/bundle/msi/*.msi
# Windows: src-tauri/target/release/bundle/nsis/*.exe
# macOS:   src-tauri/target/release/bundle/dmg/*.dmg
# Linux:   src-tauri/target/release/bundle/deb/*.deb
```

---

## 📦 NPM Scripts

Thêm vào `package.json`:

```json
{
  "scripts": {
    "build:static": "next build && next export",
    "cap:sync": "npx cap sync",
    "cap:android": "npx cap open android",
    "cap:ios": "npx cap open ios",
    "android:debug": "cd android && ./gradlew assembleDebug",
    "android:release": "cd android && ./gradlew assembleRelease",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

---

## 🔐 Signing Apps

### Android Keystore

```bash
# Generate keystore
keytool -genkey -v -keystore neo-edu-release.keystore \
  -alias neo-edu -keyalg RSA -keysize 2048 -validity 10000

# Configure in android/app/build.gradle
android {
    signingConfigs {
        release {
            storeFile file("neo-edu-release.keystore")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias "neo-edu"
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
}
```

### iOS Provisioning

1. Tạo Apple Developer Account ($99/year)
2. Tạo App ID trong Apple Developer Portal
3. Tạo Provisioning Profile
4. Import vào Xcode

### Windows Code Signing

```bash
# Tạo self-signed certificate (development)
New-SelfSignedCertificate -Type Custom -Subject "CN=NEO-EDU" \
  -KeyUsage DigitalSignature -FriendlyName "NEO-EDU Dev" \
  -CertStoreLocation "Cert:\CurrentUser\My"
```

---

## 🚀 CI/CD

### GitHub Actions - Android

```yaml
# .github/workflows/android.yml
name: Android Build

on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build static
        run: npm run build:static
        
      - name: Sync Capacitor
        run: npx cap sync android
        
      - name: Build APK
        run: cd android && ./gradlew assembleRelease
        
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: app-release
          path: android/app/build/outputs/apk/release/
```

---

## ⚠️ Lưu ý quan trọng

1. **Static Export**: Next.js cần export static để Capacitor đọc được
   - Không dùng được Server Components
   - Không dùng được API Routes (cần backend riêng)
   - Image Optimization cần config external loader

2. **API Calls**: Mobile app cần gọi API qua HTTPS
   ```typescript
   // Sử dụng environment variable
   const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neo-edu.vercel.app/api'
   ```

3. **Deep Links**: Cấu hình trong AndroidManifest.xml và Info.plist

4. **Push Notifications**: Cần Firebase (Android) và APNs (iOS)

---

## 📋 Checklist trước khi build

- [ ] Đã export static thành công
- [ ] Đã test trên emulator/simulator
- [ ] Đã cấu hình signing (release build)
- [ ] Đã setup environment variables
- [ ] Đã test deep links
- [ ] Đã chuẩn bị store assets (icons, screenshots)
