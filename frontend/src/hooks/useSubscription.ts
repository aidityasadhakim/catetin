/**
 * useSubscription - TanStack Query hook for user subscription status
 *
 * This hook fetches the user's subscription plan and message limits.
 *
 * @example
 * const { data, isLoading, error } = useSubscription()
 * if (data?.plan === 'paid') { ... }
 */

import { useQuery } from '@tanstack/react-query'
import { useApiClient, apiKeys, type SubscriptionStatus } from '../lib/api'

/**
 * Hook to fetch and cache user subscription status
 */
export function useSubscription() {
  const api = useApiClient()

  return useQuery({
    queryKey: apiKeys.subscription(),
    queryFn: async () => {
      const response = await api.get<SubscriptionStatus>('/api/subscription')

      if (response.error) {
        throw new Error(response.error)
      }

      return response.data!
    },
    // Subscription status changes rarely, cache for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Refetch on window focus to catch upgrades
    refetchOnWindowFocus: true,
  })
}

/**
 * Helper to check if user can send messages
 */
export function useCanSendMessage() {
  const { data: subscription, isLoading } = useSubscription()

  return {
    canSend: subscription?.can_send_message ?? true,
    isPaid: subscription?.plan === 'paid',
    messagesRemaining:
      subscription?.plan === 'paid'
        ? Infinity
        : Math.max(
            0,
            (subscription?.message_limit ?? 8) -
              (subscription?.messages_today ?? 0),
          ),
    isLoading,
  }
}
