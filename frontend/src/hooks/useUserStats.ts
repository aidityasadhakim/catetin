/**
 * useUserStats - TanStack Query hook for user gamification stats
 *
 * This hook is the template pattern for all API hooks in Catetin.
 *
 * ## Pattern for creating new hooks:
 *
 * 1. Import useQuery/useMutation from @tanstack/react-query
 * 2. Import useApiClient and apiKeys from '../lib/api'
 * 3. Define the hook using the pattern below
 * 4. Export from hooks/index.ts
 *
 * ## Key conventions:
 *
 * - Use apiKeys for consistent cache key management
 * - Throw errors for failed requests (TanStack Query handles the state)
 * - Return the full useQuery result for access to isLoading, error, etc.
 * - Only call API when authenticated (enabled option)
 *
 * ## Example usage in components:
 *
 * ```tsx
 * function Dashboard() {
 *   const { data: stats, isLoading, error } = useUserStats()
 *
 *   if (isLoading) return <Skeleton />
 *   if (error) return <ErrorMessage error={error} />
 *
 *   return (
 *     <div>
 *       <span>Tinta Emas: {stats.golden_ink}</span>
 *       <span>Marmer: {stats.marble}</span>
 *     </div>
 *   )
 * }
 * ```
 */

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import {  apiKeys, useApiClient } from '../lib/api'
import type {UserStats} from '../lib/api';

/**
 * Fetches the current user's gamification stats (Tinta Emas, Marmer, streaks).
 *
 * The backend auto-creates stats on first request (upsert behavior),
 * so this will always return data for authenticated users.
 *
 * @returns TanStack Query result with UserStats data
 */
export function useUserStats() {
  const api = useApiClient()
  const { isSignedIn } = useAuth()

  return useQuery({
    queryKey: apiKeys.stats(),
    queryFn: async (): Promise<UserStats> => {
      const { data, error } = await api.get<UserStats>('/api/stats')
      if (error) {
        throw new Error(error)
      }
      if (!data) {
        throw new Error('No data returned from stats endpoint')
      }
      return data
    },
    // Only fetch when user is authenticated
    enabled: !!isSignedIn,
    // Stats don't change frequently, cache for 1 minute
    staleTime: 60 * 1000,
  })
}
