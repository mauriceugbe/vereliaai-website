// src/screens/WelcomeScreen.tsx
// First screen shown to unauthenticated users.
// "Start free trial" opens Safari/Chrome to vereliaai.com/sign-up
// "Log in" uses Clerk's native auth flow
// Deep link from the website lands back here with a token and auto-logs the user in

import React, { useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Linking, Platform, SafeAreaView, StatusBar,
} from 'react-native'
import { useSSO, useAuth } from '@clerk/clerk-expo'
import * as WebBrowser from 'expo-web-browser'
import { useRouter } from 'expo-router'

WebBrowser.maybeCompleteAuthSession()

const WEB_APP_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://app.vereliaai.com'

export default function WelcomeScreen() {
  const { startSSOFlow } = useSSO()
  const { isSignedIn } = useAuth()
  const router = useRouter()

  // If already signed in (e.g. deep link returned with token), go to dashboard
  useEffect(() => {
    if (isSignedIn) router.replace('/dashboard')
  }, [isSignedIn])

  // Handle deep link from website after sign-up
  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      if (url.includes('vereliaai://auth/callback')) {
        // Clerk handles the token automatically via its SDK
        // Just navigate to dashboard
        router.replace('/dashboard')
      }
    }
    const sub = Linking.addEventListener('url', handleDeepLink)
    return () => sub.remove()
  }, [])

  const handleStartTrial = () => {
    // Opens browser to website sign-up — Stripe collects card, no Apple fees
    Linking.openURL(`${WEB_APP_URL}/sign-up?source=mobile_app`)
  }

  const handleLogIn = async () => {
    try {
      // Clerk native Google SSO or email magic link
      const result = await startSSOFlow({ strategy: 'oauth_google' })
      if (result.createdSessionId) {
        router.replace('/dashboard')
      }
    } catch (err) {
      console.error('[WelcomeScreen handleLogIn]', err)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoGem}>
            <Text style={styles.logoStar}>✦</Text>
          </View>
          <Text style={styles.logoText}>
            Verelia<Text style={styles.logoAccent}>AI</Text>
          </Text>
        </View>

        {/* Headline */}
        <Text style={styles.headline}>
          Business intelligence that follows you
        </Text>
        <Text style={styles.sub}>
          Connect every platform and tool. Know exactly what drives your business.
        </Text>

        {/* Feature pills */}
        <View style={styles.pills}>
          {['Social analytics', 'Revenue clarity', 'AI advisor', 'All platforms'].map(pill => (
            <View key={pill} style={styles.pill}>
              <Text style={styles.pillText}>{pill}</Text>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={styles.ctas}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleStartTrial}>
            <Text style={styles.primaryBtnText}>Start free trial</Text>
            <Text style={styles.primaryBtnNote}>Sign up at vereliaai.com →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleLogIn}>
            <Text style={styles.secondaryBtnText}>Already a member? Log in</Text>
          </TouchableOpacity>
        </View>

        {/* Fine print */}
        <Text style={styles.finePrint}>
          Card required to start. 7-day free trial.{'\n'}
          Cancel before day 8 and you owe nothing.
        </Text>

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 0,
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
  },
  logoGem: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoStar: { fontSize: 18, color: '#fff' },
  logoText: { fontSize: 22, fontWeight: '700', color: '#111827' },
  logoAccent: { color: '#0891b2' },
  headline: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 40,
  },
  pill: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#b3dce8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pillText: { fontSize: 12, color: '#0891b2', fontWeight: '500' },
  ctas: { width: '100%', gap: 12, marginBottom: 20 },
  primaryBtn: {
    backgroundColor: '#0891b2',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 2 },
  primaryBtnNote: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  secondaryBtnText: { fontSize: 15, color: '#374151', fontWeight: '500' },
  finePrint: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 16,
  },
})
