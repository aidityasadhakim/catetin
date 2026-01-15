/**
 * useSummaries - TanStack Query hooks for weekly summaries (Risalah Mingguan)
 *
 * Provides hooks for:
 * - Listing all weekly summaries
 * - Getting the latest summary (with auto-generation)
 */

import { useQuery } from '@tanstack/react-query'
import { apiKeys, useApiClient } from '../lib/api'
import type { ListSummariesResponse, WeeklySummary } from '../lib/api'

/**
 * Fetches all weekly summaries for the current user
 * Premium-only feature - will return 403 for free users
 *
 * @example
 * const { data, isLoading, error } = useSummaries()
 * if (error?.message.includes('PREMIUM_REQUIRED')) {
 *   // Show upgrade prompt
 * }
 */
export function useSummaries(limit = 10, offset = 0) {
  const api = useApiClient()

  return useQuery({
    queryKey: [...apiKeys.weeklySummaries(), { limit, offset }],
    queryFn: async (): Promise<ListSummariesResponse> => {
      const { data, error } = await api.get<ListSummariesResponse>(
        `/api/summaries?limit=${limit}&offset=${offset}`,
      )
      if (error) {
        throw new Error(error)
      }
      if (!data) {
        throw new Error('No data returned from summaries endpoint')
      }
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetches the latest weekly summary, generating one if needed
 * Premium-only feature - will return 403 for free users
 *
 * @example
 * const { data, isLoading, error } = useLatestSummary()
 */
export function useLatestSummary() {
  const api = useApiClient()

  return useQuery({
    queryKey: [...apiKeys.weeklySummaries(), 'latest'],
    queryFn: async (): Promise<WeeklySummary | null> => {
      const { data, error } = await api.get<WeeklySummary | { summary: null; message: string }>(
        '/api/summaries/latest',
      )
      if (error) {
        throw new Error(error)
      }
      if (!data) {
        throw new Error('No data returned from latest summary endpoint')
      }
      // Handle "no summary yet" response
      if ('message' in data && data.summary === null) {
        return null
      }
      return data as WeeklySummary
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
