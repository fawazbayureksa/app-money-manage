# 🔧 EAS Build Network Error - Complete Fix Documentation

## 🎯 Problem Statement

**Issue**: API works perfectly in development (`npm start`) but fails with network errors after building APK using `eas build --platform android --profile preview --clear-cache`.

**Root Cause Analysis**:
1. **Android Security Policy**: Android 9+ blocks cleartext (HTTP) traffic by default in production builds
2. **Environment Variables**: `app.json` doesn't support dynamic environment variables during EAS builds
3. **Localhost/Local IPs**: Hardcoded localhost/127.0.0.1 addresses won't work in built APKs on physical devices

---

## ✅ Solutions Implemented

### 1. **Migrated from `app.json` to `app.config.js`**

**Why**: `app.config.js` allows dynamic configuration based on environment variables during build time.

**File**: [`app.config.js`](app.config.js)

**Key Features**:
- Reads `EXPO_PUBLIC_API_URL` from environment variables
- Dynamically enables/disables cleartext traffic based on build profile
- Logs build configuration during build process
- Injects API URL into `expo.extra` for runtime access

```javascript
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://34.158.34.129:8080/api';
const usesCleartextTraffic = process.env.EAS_BUILD_PROFILE === 'production' ? false : true;
```

### 2. **Updated `eas.json` with Build Profiles**

**File**: [`eas.json`](eas.json)

**Each profile now includes**:
- `EXPO_PUBLIC_API_URL`: API base URL specific to the environment
- `EAS_BUILD_PROFILE`: Profile identifier for conditional logic

**Profiles**:
- **development**: Local development builds with HTTP support
- **preview**: Testing APKs with HTTP support (current issue target)
- **production**: Production builds (should use HTTPS)

```json
"preview": {
  "distribution": "internal",
  "android": {
    "buildType": "apk"
  },
  "env": {
    "EXPO_PUBLIC_API_URL": "http://34.158.34.129:8080/api",
    "EAS_BUILD_PROFILE": "preview"
  }
}
```

### 3. **Enhanced API Configuration with Runtime Validation**

**File**: [`src/config/api.ts`](src/config/api.ts)

**Features**:
- Multi-source API URL resolution (priority: Constants > env > fallback)
- Runtime validation against localhost/127.0.0.1
- URL format validation
- Comprehensive logging for debugging APK issues

```typescript
const getApiUrl = (): string => {
  const configUrl = Constants.expoConfig?.extra?.apiUrl;
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  const fallbackUrl = 'http://34.158.34.129:8080/api';
  return configUrl || envUrl || fallbackUrl;
};
```

### 4. **Added Request/Response Logging to API Client**

**File**: [`src/api/client.ts`](src/api/client.ts)

**Logging Added**:
- ✅ Successful API responses with status codes
- ❌ Detailed error information including:
  - HTTP status codes
  - Network errors (no response)
  - Request configuration errors
- 🔍 Troubleshooting hints for common issues

---

## 🚀 How to Build & Verify

### Step 1: Clear Previous Builds
```bash
eas build --platform android --profile preview --clear-cache
```

### Step 2: Monitor Build Logs

Look for these log messages in EAS build logs:
```
🔧 Build Configuration:
  - Profile: preview
  - API URL: http://34.158.34.129:8080/api
  - Cleartext Traffic: true
```

### Step 3: Install & Test APK

Download the APK from EAS build dashboard and install on your device.

### Step 4: Check Runtime Logs

Use React Native debugger or `adb logcat` to see:
```
🌐 API Configuration Loaded:
  - Build Profile: preview
  - API Base URL: http://34.158.34.129:8080/api
  - Source: app.config.js

🔌 API Client initialized with base URL: http://34.158.34.129:8080/api

📤 API Request: POST http://34.158.34.129:8080/api/auth/login
✅ API Response: 200 POST /auth/login
```

---

## ✓ Final Validation Checklist

### Backend Accessibility
- [ ] Backend server binds to `0.0.0.0` (not `127.0.0.1`)
- [ ] Backend is accessible from external devices: `curl http://34.158.34.129:8080/api/health`
- [ ] Firewall/security groups allow incoming traffic on port 8080
- [ ] API is not behind a VPN or restricted network

### App Configuration
- [ ] `app.config.js` exists and uses environment variables
- [ ] `eas.json` preview profile has `EXPO_PUBLIC_API_URL` set
- [ ] No usage of `localhost`, `127.0.0.1`, or `10.0.2.2` in production code
- [ ] Android `usesCleartextTraffic` is `true` for preview builds

### Build Verification
- [ ] EAS build completes successfully
- [ ] Build logs show correct API URL in "Build Configuration" section
- [ ] APK file is downloaded and installable

### Runtime Verification
- [ ] App installs without errors
- [ ] Console logs show correct API URL on app launch
- [ ] API requests are logged with `📤` prefix
- [ ] No "Network Error" or "ERR_CLEARTEXT_NOT_PERMITTED" errors
- [ ] Login/API calls work correctly

---

## 🔒 Production Deployment Notes

### For Production Builds

**⚠️ CRITICAL**: Never use HTTP in production! 

Update [`eas.json`](eas.json) production profile:
```json
"production": {
  "autoIncrement": true,
  "env": {
    "EXPO_PUBLIC_API_URL": "https://api.your-domain.com/api",
    "EAS_BUILD_PROFILE": "production"
  }
}
```

### Setting up HTTPS

**Options**:
1. **Reverse Proxy** (Recommended):
   - Use Nginx/Caddy in front of your Go backend
   - Let's Encrypt for free SSL certificates
   - Auto-renewal with Certbot

2. **Cloud Load Balancer**:
   - AWS ALB, Google Cloud Load Balancer, Azure Load Balancer
   - Handles SSL termination automatically

3. **Go TLS Server**:
   - Use `http.ListenAndServeTLS()` in Go
   - Manage certificates manually

---

## 🐛 Troubleshooting

### Issue: Still getting network errors after build

**Check**:
1. Run `adb logcat | grep -E "(API|Network)"` to see actual errors
2. Verify the API URL in logs matches your backend
3. Test backend accessibility: `curl http://34.158.34.129:8080/api/health`
4. Ensure device is not behind a restrictive firewall

### Issue: ERR_CLEARTEXT_NOT_PERMITTED

**Solution**: Ensure `usesCleartextTraffic: true` in `app.config.js`:
```javascript
android: {
  usesCleartextTraffic: usesCleartextTraffic
}
```

### Issue: Environment variables not being injected

**Check**:
1. Are you using `app.config.js` (not `app.json`)?
2. Did you clear the cache: `--clear-cache`?
3. Check EAS build logs for "Build Configuration" output

### Issue: Works in development, not in preview

**Difference**: Development uses Expo Go which bypasses some Android security policies. Preview APK enforces all production security rules.

---

## 📊 Why Development Works But APK Fails

| Aspect | Development (`npm start`) | Preview APK Build |
|--------|--------------------------|-------------------|
| Environment | Expo Go app on device | Standalone APK |
| Network Security | Relaxed (allows HTTP) | Strict (blocks HTTP by default) |
| Configuration | Runtime `.env` files | Build-time environment variables |
| Debugging | Metro bundler logs | Android system logs only |
| API URL Resolution | Can change without rebuild | Baked into APK at build time |

---

## 🎓 Key Learnings

1. **EAS builds require environment variables in `eas.json`**, not `.env` files
2. **Android enforces cleartext security** in production builds (Android 9+)
3. **`app.config.js` is essential** for dynamic configuration in EAS builds
4. **Localhost never works** in physical device APKs
5. **Logging is critical** for debugging built APKs since you can't use dev tools
6. **Backend must be publicly accessible** or use proper networking (VPN, ngrok, etc.)

---

## 📚 References

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [EAS Build Configuration](https://docs.expo.dev/build/eas-json/)
- [Android Network Security Config](https://developer.android.com/training/articles/security-config)
- [Expo Constants API](https://docs.expo.dev/versions/latest/sdk/constants/)

---

## 🎉 Success Criteria

Your setup is working correctly when:
- ✅ Preview APK builds without errors
- ✅ App launches and shows correct API URL in logs
- ✅ Login/authentication succeeds
- ✅ All API calls complete successfully
- ✅ No network or cleartext errors in logs

**Current Status**: ✅ All fixes implemented - Ready for rebuild!
