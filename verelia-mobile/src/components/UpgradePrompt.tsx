// src/components/UpgradePrompt.tsx
// Bottom sheet shown when a user taps a locked feature or the Upgrade button.
// Opens the Stripe billing portal in the browser — no Apple/Google fees.
// After upgrading, user returns to app and plan refreshes automatically.

import React from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Pressable, Linking, ScrollView, Platform,
} from 'react-native'
import { useAuth } from '@clerk/clerk-expo'
import { useUserPlan, Plan } from '../hooks/useUserPlan'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://app.vereliaai.com'

const PLAN_DETAILS: Record<Plan, {
  label: string
  price: string
  color: string
  features: string[]
}> = {
  starter: {
    label: 'Starter',
    price: '$149/mo',
    color: '#64748b',
    features: [
      '3 social platform connections',
      'Revenue attribution',
      '50 AI queries per month',
      '1 accounting tool sync',
      'Website pixel analytics',
    ],
  },
  growth: {
    label: 'Growth',
    price: '$499/mo',
    color: '#0891b2',
    features: [
      'Unlimited social platforms',
      'Cross-platform compare view',
      'Unlimited AI queries',
      'All accounting + payroll tools',
      'Team & employee data',
      'WoW / MoM trend reports',
      'Up to 5 locations',
    ],
  },
  pro: {
    label: 'Pro',
    price: '$1,500/mo',
    color: '#7c3aed',
    features: [
      'Everything in Growth',
      'Unlimited locations',
      'Custom AI model on your data',
      'White-label reports',
      'Full API access',
      'Dedicated success manager',
    ],
  },
}

interface UpgradePromptProps {
  visible: boolean
  currentPlan: Plan
  requiredPlan: Plan
  feature?: string
  onClose: () => void
}

export function UpgradePrompt({
  visible,
  currentPlan,
  requiredPlan,
  onClose,
}: UpgradePromptProps) {
  const { getToken } = useAuth()
  const { refresh } = useUserPlan()
  const [loading, setLoading] = React.useState(false)

  const details = PLAN_DETAILS[requiredPlan]

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      // Get a Stripe billing portal URL from your API
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/stripe/portal`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: 'vereliaai://billing/complete',
          targetPlan: requiredPlan,
        }),
      })

      const { url } = await res.json()

      // Open Stripe portal in browser — no Apple/Google fees
      await Linking.openURL(url)
      onClose()

      // Refresh plan after a short delay (webhook updates DB)
      setTimeout(() => refresh(), 3000)
    } catch (err) {
      console.error('[UpgradePrompt]', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Handle bar */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.planBadge, { backgroundColor: details.color + '15' }]}>
            <Text style={[styles.planBadgeText, { color: details.color }]}>
              {details.label} Plan
            </Text>
          </View>
          <Text style={styles.price}>{details.price}</Text>
          <Text style={styles.subtitle}>
            Unlock this feature and everything else on {details.label}
          </Text>
        </View>

        {/* Features */}
        <ScrollView style={styles.featureList} showsVerticalScrollIndicator={false}>
          {details.features.map((feat, i) => (
            <View key={i} style={styles.featRow}>
              <Text style={styles.featCheck}>✓</Text>
              <Text style={styles.featText}>{feat}</Text>
            </View>
          ))}
        </ScrollView>

        {/* CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.upgradeBtn, { backgroundColor: details.color }]}
            onPress={handleUpgrade}
            disabled={loading}
          >
            <Text style={styles.upgradeBtnText}>
              {loading ? 'Opening billing...' : `Upgrade to ${details.label}`}
            </Text>
          </TouchableOpacity>
          <Text style={styles.footerNote}>
            Managed securely via Stripe. Cancel anytime.
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

// You also need this API route on your web app:
// POST /api/stripe/portal — returns a Stripe billing portal URL
// Add to web-app-updates/stripe-portal-route.ts

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  planBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  featureList: {
    padding: 20,
    maxHeight: 240,
  },
  featRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  featCheck: {
    fontSize: 14,
    color: '#0891b2',
    fontWeight: '600',
    marginTop: 1,
  },
  featText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    paddingTop: 0,
    alignItems: 'center',
    gap: 8,
  },
  upgradeBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  upgradeBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  footerNote: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
  cancelBtn: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 14,
    color: '#6b7280',
  },
})
