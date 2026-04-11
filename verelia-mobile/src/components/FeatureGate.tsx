// src/components/FeatureGate.tsx
// Wrap any feature or screen that requires a specific plan.
// Locked features show a blurred overlay with an upgrade CTA
// instead of a dead end or empty screen.
//
// Usage:
//   <FeatureGate feature="platform_compare" requiredPlan="growth">
//     <PlatformCompareScreen />
//   </FeatureGate>

import React from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable
} from 'react-native'
import { BlurView } from 'expo-blur'
import { useUserPlan, Plan } from '../hooks/useUserPlan'
import { UpgradePrompt } from './UpgradePrompt'

const PLAN_RANK: Record<Plan, number> = { starter: 0, growth: 1, pro: 2 }

const PLAN_LABEL: Record<Plan, string> = {
  starter: 'Starter',
  growth: 'Growth',
  pro: 'Pro',
}

interface FeatureGateProps {
  feature: string            // e.g. "platform_compare"
  requiredPlan: Plan         // minimum plan needed
  children: React.ReactNode
  mode?: 'blur' | 'hidden'  // blur = show blurred preview, hidden = hide completely
}

export function FeatureGate({
  feature,
  requiredPlan,
  children,
  mode = 'blur',
}: FeatureGateProps) {
  const { plan, hasFeature, loading } = useUserPlan()
  const [showUpgrade, setShowUpgrade] = React.useState(false)

  // While loading, render children normally (avoids flash)
  if (loading) return <>{children}</>

  // Has access — render normally
  if (hasFeature(feature)) return <>{children}</>

  // Locked
  const currentRank = PLAN_RANK[plan?.plan ?? 'starter']
  const requiredRank = PLAN_RANK[requiredPlan]

  if (mode === 'hidden') return null

  return (
    <>
      <View style={styles.container}>
        {/* Render children underneath the blur */}
        <View style={styles.content} pointerEvents="none">
          {children}
        </View>

        {/* Blur overlay */}
        <BlurView intensity={18} tint="light" style={StyleSheet.absoluteFill} />

        {/* Lock badge */}
        <Pressable style={styles.lockBadge} onPress={() => setShowUpgrade(true)}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockTitle}>
            Available on {PLAN_LABEL[requiredPlan]}
          </Text>
          <Text style={styles.lockSub}>Tap to upgrade</Text>
        </Pressable>
      </View>

      {/* Upgrade bottom sheet */}
      <UpgradePrompt
        visible={showUpgrade}
        currentPlan={plan?.plan ?? 'starter'}
        requiredPlan={requiredPlan}
        feature={feature}
        onClose={() => setShowUpgrade(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },
  content: {
    // Children render here but are non-interactive
  },
  lockBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -80 }, { translateY: -44 }],
    width: 160,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  lockIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  lockTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 3,
  },
  lockSub: {
    fontSize: 11,
    color: '#0891b2',
    fontWeight: '500',
  },
})
