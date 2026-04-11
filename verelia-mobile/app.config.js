// app.config.js — Expo configuration with deep link setup
// Place this in the root of your React Native project
// This registers the vereliaai:// URL scheme so the phone knows
// to open Verelia when it sees that link after web sign-up

module.exports = {
  expo: {
    name: 'Verelia AI',
    slug: 'verelia-ai',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    scheme: 'vereliaai', // <-- this is the deep link scheme

    // iOS configuration
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.vereliaai.app',
      associatedDomains: [
        'applinks:vereliaai.com',       // universal links (preferred on iOS)
        'applinks:app.vereliaai.com',
      ],
    },

    // Android configuration
    android: {
      package: 'com.vereliaai.app',
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: 'vereliaai.com',
              pathPrefix: '/auth',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },

    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://app.vereliaai.com',
      clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    },
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// WHAT YOU ALSO NEED ON THE WEB APP SIDE:
//
// After a user signs up on vereliaai.com, redirect them to:
// vereliaai://auth/callback?token=<clerk_session_token>
//
// In your Next.js sign-up success page (src/app/sign-up/complete/page.tsx):
//
// const token = await clerk.sessions.getToken()
// const deepLink = `vereliaai://auth/callback?token=${token}`
//
// // Try deep link first, fall back to web app
// window.location.href = deepLink
// setTimeout(() => {
//   // If app not installed, stay on web app
//   window.location.href = '/dashboard'
// }, 2000)
//
// ─────────────────────────────────────────────────────────────────────────────
// APPLE UNIVERSAL LINKS (iOS preferred over custom scheme):
//
// Add this file to your website at:
// vereliaai.com/.well-known/apple-app-site-association
//
// {
//   "applinks": {
//     "apps": [],
//     "details": [{
//       "appID": "YOURTEAMID.com.vereliaai.app",
//       "paths": ["/auth/*"]
//     }]
//   }
// }
// ─────────────────────────────────────────────────────────────────────────────
