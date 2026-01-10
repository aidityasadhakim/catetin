/**
 * useAI - TanStack Query hooks for AI interactions
 *
 * Provides hooks for:
 * - Starting a session with AI opening message
 * - Sending messages and getting AI responses
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiKeys, useApiClient } from '../lib/api'
import type { AIRespondResponse, StartSessionResponse } from '../lib/api'

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
        '/api/sessions/start'
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
 * This is the main interaction hook for journaling:
 * 1. Saves the user's message
 * 2. Generates AI response
 * 3. Saves AI response
 * 4. On turn 3: ends session and calculates rewards
 *
 * @example
 * const { mutate: sendToAI, isPending } = useAIRespond()
 * sendToAI(
 *   { sessionId, content: 'Hari ini aku merasa...' },
 *   {
 *     onSuccess: ({ message, turn_number, is_complete, rewards }) => {
 *       if (is_complete && rewards) {
 *         showRewardsAnimation(rewards)
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
        { content }
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
        queryKey: [...apiKeys.session(sessionId), 'messages'],
      })

      // If session is complete, also invalidate stats (rewards were applied)
      if (data.is_complete && data.rewards) {
        queryClient.invalidateQueries({
          queryKey: apiKeys.stats(),
        })
      }
    },
  })
}
