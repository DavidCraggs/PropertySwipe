# Native Mobile Setup Guide (Capacitor)

Your PropertySwipe app now supports **Web + iOS + Android** from a single codebase!

## What Was Set Up

- ✅ Capacitor installed and configured
- ✅ Android platform added (`/android` folder)
- ✅ iOS platform added (`/ios` folder)
- ✅ Build scripts added to package.json
- ✅ Web build remains fully functional

---

## Testing on Android (Expo Alternative)

### Option 1: Android Studio (Full Build)

**Requirements:**
- Install [Android Studio](https://developer.android.com/studio)
- Install Android SDK (comes with Android Studio)

**Steps:**
```bash
# 1. Build and sync
npm run cap:android

# 2. Android Studio will open
# 3. Click "Run" (green play button)
# 4. Select your connected device or emulator
```

### Option 2: Physical Device via USB (Fastest)

**Steps:**
1. Enable **Developer Mode** on your Android phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings → Developer Options
   - Enable "USB Debugging"

2. Connect phone via USB

3. Run:
```bash
npm run cap:android
```

4. In Android Studio, select your device and click Run

---

## Testing on iOS

**Requirements:**
- **Mac computer** (iOS development requires macOS)
- Install [Xcode](https://apps.apple.com/app/xcode/id497799835)
- Apple Developer account (free tier works for testing)

**Steps:**
```bash
# 1. Build and sync
npm run cap:ios

# 2. Xcode will open
# 3. Connect your iPhone via USB
# 4. Select your device in Xcode
# 5. Click "Run" (play button)
```

**Note:** For iOS on Windows, you'll need:
- A Mac for building, OR
- A cloud Mac service like [MacStadium](https://www.macstadium.com/) or [MacinCloud](https://www.macincloud.com/)

---

## Development Workflow

### Making Changes

1. **Edit your React code** as normal in `/src`

2. **Test in web browser** (fastest):
```bash
npm run dev
# Open http://localhost:5173
```

3. **When ready to test on mobile:**
```bash
# This rebuilds the app and syncs to Android/iOS
npm run cap:sync

# Then open in Android Studio
npm run cap:android

# Or Xcode
npm run cap:ios
```

### Quick Commands

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Run web version (fastest for development) |
| `npm run build` | Build production web bundle |
| `npm run cap:sync` | Build + sync to Android & iOS |
| `npm run cap:android` | Build, sync, and open Android Studio |
| `npm run cap:ios` | Build, sync, and open Xcode |

---

## Testing Without Android Studio/Xcode

If you don't have native IDEs installed, you can still test:

### Web (Works on Desktop + Mobile Browsers)
```bash
npm run dev
```
Open on your phone's browser: `http://YOUR_IP:5173`
Currently: `http://192.168.86.220:5175`

### Deploy to Web (Vercel)
Deploy to Vercel to get a public URL that works on any device:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

---

## Supabase on Mobile

Your Supabase setup will work on both web and native mobile automatically! The same configuration in `.env.local` applies to all platforms.

**Important:** When building for production mobile apps, you'll want to:
1. Set up proper environment variables for mobile
2. Consider using Capacitor's native storage for better performance
3. Test offline functionality

---

## Current Status

✅ **Web:** Fully working at http://localhost:5175
✅ **Android:** Platform added, ready to build
✅ **iOS:** Platform added, ready to build (requires Mac)
✅ **Shared Codebase:** One React app for all platforms

---

## What You Can Do Right Now

### Without Installing Android Studio/Xcode:
1. **Test on mobile browser:** Open http://192.168.86.220:5175 on your phone
2. **Deploy to Vercel:** Get public URL for easy mobile testing
3. **Keep developing:** Use `npm run dev` and test in browser

### With Android Studio:
1. **Install Android Studio**
2. **Run `npm run cap:android`**
3. **Click Run** → Test on real device or emulator

### With Xcode (Mac only):
1. **Install Xcode**
2. **Run `npm run cap:ios`**
3. **Click Run** → Test on iPhone

---

## Troubleshooting

### "Android Studio not found"
- Install from https://developer.android.com/studio
- Add to PATH or open manually from `/android` folder

### "Xcode not found"
- macOS only - install from App Store
- Or use cloud Mac service

### "Build failed"
- Run `npm run build` first to check for TypeScript errors
- Check console for specific error messages

### "Properties not syncing between platforms"
- Make sure Supabase is configured (see SUPABASE_QUICK_START.md)
- Without Supabase, each platform uses separate localStorage

---

## Next Steps

1. **For Demo:** Test on mobile browser via `http://192.168.86.220:5175`
2. **For Production:** Install Android Studio → build Android APK
3. **For iOS:** Need Mac → build in Xcode
4. **For Deployment:** Use Vercel (web) + Play Store (Android) + App Store (iOS)

---

## Questions?

- Web app still works exactly the same: `npm run dev`
- Mobile is an ADD-ON, not a replacement
- You now have ONE codebase for web + iOS + Android
- Capacitor wraps your web app in a native container
