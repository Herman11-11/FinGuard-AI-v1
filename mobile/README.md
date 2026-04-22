# FinGuard Mobile

This is the mobile workspace for FinGuard-AI. It is set up as an Expo app so we can move quickly into camera-based verification, legacy deed capture, and secure field workflows.

## Why Expo

Expo is the best fit for this project right now because it matches the existing React/Firebase stack and gives us a practical route into device camera access and mobile testing. Expo's docs recommend `create-expo-app` as the easiest way to start a React Native app. For this project we are intentionally targeting Expo SDK 52, because the Expo version table documents SDK 52 against React 18.3.1 and React Native 0.76, which gives us a better chance of working with older phones running Expo Go.

Sources:
- https://docs.expo.dev/more/create-expo/
- https://docs.expo.dev/versions/latest/
- https://docs.expo.dev/versions/v53.0.0

## Initial scope

The scaffold includes:
- backend health connection to the deployed Railway API
- a clean mobile shell with three starter areas
- overview tab
- verify tab placeholder
- legacy capture tab placeholder

## Local setup

1. Make sure you have Node 20+ installed.
2. From the repo root:

```bash
cd mobile
cp .env.example .env
npm install
npm run start
```

3. In Expo, open on:
- iOS simulator
- Android emulator
- Expo Go on a physical device

## Compatibility note

We intentionally pinned the mobile workspace to Expo SDK 52 for better device compatibility during local testing. If Expo Go on the device is still too old even for SDK 52, the next fallback is testing on a simulator or using a development build later.

## Environment

Set the backend URL in `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=https://finguard-ai-backend-production-78d6.up.railway.app
```

Expo exposes `EXPO_PUBLIC_*` variables to the client app.

## What we build next

1. camera and QR scan flow
2. document upload to `/api/documents/verify`
3. legacy deed enrollment flow
4. officer authentication and protected admin-lite mobile views
