/**
 * useAI - TanStack Query hooks for AI interactions
 *
 * Provides hooks for:
 * - Getting or creating today's session (auto-resume)
 * - Starting a session with AI opening message
 * - Sending messages and getting AI responses
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiKeys, useApiClient } from '../lib/api'
import type {
  AIRespondResponse,
  StartSessionResponse,
  TodaySessionResponse,
} from '../lib/api'

/**
 * Gets today's active session or creates a new one.
 *
 * This is the primary way to start/resume journaling:
 * - If user has an active session from today, returns it with all messages
 * - If no session today, creates a new one with an AI opening message
 *
 * @example
 * const { data, isLoading } = useTodaySession()
 * if (data) {
 *   // data.session, data.messages, data.is_new, data.depth_level
 * }
 */
export function useTodaySession() {
  const api = useApiClient()

  return useQuery({
    queryKey: apiKeys.sessionToday(),
    queryFn: async (): Promise<TodaySessionResponse> => {
      const { data, error } = await api.get<TodaySessionResponse>(
        '/api/sessions/today',
      )
      if (error) {
        throw new Error(error)
      }
      if (!data) {
        throw new Error('No data returned from today session endpoint')
      }
      return data
    },
    staleTime: 1000 * 60, // 1 minute - don't refetch too often
  })
}

/**
 * Starts a new journaling session and gets an AI opening message.
 *
 * This is the preferred way to start a journaling session as it:
 * 1. Creates a new session
 * 2. Generates an opening message from Sang Pujangga
 * 3. Saves the opening message
 *
 * @example
 * const { mutate: startSession, isPending } = useStartSession()
 * startSession(undefined, {
 *   onSuccess: ({ session, opening_message }) => {
 *     navigate(`/refleksi/${session.id}`)
 *   }
 * })
 */
export function useStartSession() {
  const api = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<StartSessionResponse> => {
      const { data, error } = await api.post<StartSessionResponse>(
        '/api/sessions/start',
      )
      if (error) {
        throw new Error(error)
      }
      if (!data) {
        throw new Error('No data returned from start session endpoint')
      }
      return data
    },
    onSuccess: () => {
      // Invalidate sessions list
      queryClient.invalidateQueries({ queryKey: apiKeys.sessions() })
    },
  })
}

/**
 * Sends a message to the AI and gets a response.
 *
 * This is the main interaction hook for all-day journaling:
 * 1. Saves the user's message
 * 2. Generates AI response with progressive depth
 * 3. Saves AI response
 * 4. Calculates and applies rewards for this message
 *
 * @example
 * const { mutate: sendToAI, isPending } = useAIRespond()
 * sendToAI(
 *   { sessionId, content: 'Hari ini aku merasa...' },
 *   {
 *     onSuccess: ({ message, message_count, depth_level, rewards }) => {
 *       if (rewards) {
 *         showRewardsToast(rewards)
 *       }
 *     }
 *   }
 * )
 */
export function useAIRespond() {
  const api = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      content,
    }: {
      sessionId: string
      content: string
    }): Promise<AIRespondResponse> => {
      const { data, error } = await api.post<AIRespondResponse>(
        `/api/sessions/${sessionId}/respond`,
        { content },
      )
      if (error) {
        throw new Error(error)
      }
      if (!data) {
        throw new Error('No data returned from AI respond endpoint')
      }
      return data
    },
    onSuccess: (data, { sessionId }) => {
      // Invalidate session and messages
      queryClient.invalidateQueries({
        queryKey: apiKeys.session(sessionId),
      })
      queryClient.invalidateQueries({
        queryKey: apiKeys.sessionToday(),
      })

      // Invalidate stats if rewards were applied
      if (data.rewards) {
        queryClient.invalidateQueries({
          queryKey: apiKeys.stats(),
        })
      }
    },
  })
}
