// src/hooks/useUserPlan.ts
// Fetches the user's plan from your API on login and caches it.
// Used by FeatureGate and UpgradePrompt everywhere in the app.

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/clerk-expo'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type Plan = 'starter' | 'growth' | 'pro'
export type PlanStatus = 'active' | 'trialing' | 'past_due' | 'canceled'

export interface UserPlan {
  plan: Plan
  status: PlanStatus
  renewsAt: string | null
  features: string[]
  limits: {
    socialPlatforms: number    // -1 = unlimited
    accountingTools: number
    aiQueriesPerMonth: number
    locations: number
    aiQueriesUsed: number
  }
}

const CACHE_KEY = 'verelia_user_plan'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://app.vereliaai.com'

export function useUserPlan() {
  const { getToken } = useAuth()
  const [plan, setPlan] = useState<UserPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlan = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache first (unless forcing refresh)
      if (!forceRefresh) {
        const cached = await AsyncStorage.getItem(CACHE_KEY)
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          if (Date.now() - timestamp < CACHE_TTL) {
            setPlan(data)
            setLoading(false)
            return
          }
        }
      }

      const token = await getToken()
      const res = await fetch(`${API_URL}/api/user/plan`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error('Failed to fetch plan')

      const data: UserPlan = await res.json()
      setPlan(data)

      // Cache it
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
    } catch (err) {
      setError('Could not load plan')
      console.error('[useUserPlan]', err)
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => { fetchPlan() }, [fetchPlan])

  // Helper — check if user has access to a feature
  const hasFeature = (feature: string) => plan?.features.includes(feature) ?? false

  // Helper — check if a limit is reached
  const isAtLimit = (limitKey: keyof UserPlan['limits']) => {
    if (!plan) return false
    const limit = plan.limits[limitKey]
    if (limit === -1) return false // unlimited
    if (limitKey === 'aiQueriesUsed') return plan.limits.aiQueriesUsed >= plan.limits.aiQueriesPerMonth
    return false
  }

  return {
    plan,
    loading,
    error,
    hasFeature,
    isAtLimit,
    refresh: () => fetchPlan(true), // call this after an upgrade
  }
}
