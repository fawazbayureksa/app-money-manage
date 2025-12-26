# Quick Start Guide - Authentication

## 🚀 Ready to Test!

### Step 1: Configure API URL

Edit [src/config/api.ts](src/config/api.ts):

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://YOUR_SERVER_IP:8080', // Change this!
  TIMEOUT: 10000,
};
```

**Important:** 
- For iOS Simulator: `http://localhost:8080`
- For Android Emulator: `http://10.0.2.2:8080`
- For Physical Devices: `http://YOUR_COMPUTER_IP:8080`

### Step 2: Run the App

```bash
npm start
```

Then press:
- `a` for Android
- `i` for iOS
- `w` for Web

### Step 3: Test Authentication

1. **Register Flow:**
   - Click "Sign Up" on login screen
   - Enter username, email, password
   - Click "Sign Up"
   - Should navigate to main app on success

2. **Login Flow:**
   - Enter email and password
   - Click "Sign In"
   - Should navigate to main app on success

3. **Logout:**
   - Click "Logout" button on home screen
   - Should return to login screen

4. **Persistence:**
   - Close and reopen app
   - Should stay logged in (go directly to main app)

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/config/api.ts` | **START HERE** - Configure API URL |
| `src/context/AuthContext.tsx` | Authentication logic |
| `app/login.tsx` | Login route |
| `app/register.tsx` | Register route |
| `app/index.tsx` | Initial route (handles redirect) |
| `app/(tabs)/index.tsx` | Main dashboard (protected) |

## 🔧 API Requirements

Your backend must have these endpoints:

```
POST /register
Body: { username, email, password }
Response: { status: true, message: "...", data: { token: "..." } }

POST /login  
Body: { email, password }
Response: { status: true, message: "...", data: { token: "..." } }
```

## ✅ What's Working

- ✅ Login screen with validation
- ✅ Register screen with validation  
- ✅ Token storage (AsyncStorage)
- ✅ Protected routes
- ✅ Auto-logout on 401
- ✅ Form validation
- ✅ Error handling
- ✅ Loading states
- ✅ Password show/hide
- ✅ Responsive design

## 🐛 Troubleshooting

**"Network Error" or "Cannot connect"**
- Check `src/config/api.ts` BASE_URL
- Make sure backend is running
- For physical devices, use your computer's IP (not localhost)

**"Invalid credentials" when you know they're correct**
- Backend might not be returning correct response format
- Check backend logs
- Verify response format matches expected structure

**App crashes on startup**
- Run `npm install` to ensure all dependencies are installed
- Clear cache: `npm start --clear`

## 📚 Documentation

See [AUTH_IMPLEMENTATION.md](AUTH_IMPLEMENTATION.md) for complete documentation.

## ➡️ Next Features to Implement

1. Category Management (CRUD)
2. Transaction Tracking
3. Budget Management
4. Budget Alerts
5. Dashboard with Statistics
