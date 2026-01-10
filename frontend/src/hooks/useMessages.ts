/**
 * useMessages - TanStack Query hooks for session messages
 *
 * Provides hooks for:
 * - Listing messages in a session
 * - Sending a new message
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { apiKeys, useApiClient } from '../lib/api'
import type { Message } from '../lib/api'

// Response types
interface MessagesListResponse {
  messages: Array<Message>
}

/**
 * Fetches all messages for a session.
 *
 * Note: You can also use `useSession(id)` which returns both
 * the session and messages in a single request.
 *
 * @param sessionId - The session UUID
 *
 * @example
 * const { data, isLoading } = useMessages(sessionId)
 * if (data) {
 *   data.messages.map(msg => ...)
 * }
 */
export function useMessages(sessionId: string | undefined) {
  const api = useApiClient()
  const { isSignedIn } = useAuth()

  return useQuery({
    queryKey: [...apiKeys.session(sessionId ?? ''), 'messages'],
    queryFn: async (): Promise<Array<Message>> => {
      const { data, error } = await api.get<MessagesListResponse>(
        `/api/sessions/${sessionId}/messages`,
      )
      if (error) {
        throw new Error(error)
      }
      if (!data) {
        throw new Error('No data returned from messages endpoint')
      }
      return data.messages
    },
    enabled: !!isSignedIn && !!sessionId,
    staleTime: 5 * 1000, // 5 seconds - messages need to be fresh during active sessions
  })
}

/**
 * Sends a message in a session.
 *
 * Optimistically updates the message list for instant UI feedback.
 *
 * @example
 * const { mutate: sendMessage, isPending } = useSendMessage()
 * sendMessage({
 *   sessionId,
 *   role: 'user',
 *   content: 'Hari ini aku merasa...'
 * })
 */
export function useSendMessage() {
  const api = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      role,
      content,
    }: {
      sessionId: string
      role: 'user' | 'assistant'
      content: string
    }): Promise<Message> => {
      const { data, error } = await api.post<Message>(
        `/api/sessions/${sessionId}/messages`,
        { role, content },
      )
      if (error) {
        throw new Error(error)
      }
      if (!data) {
        throw new Error('No data returned from create message endpoint')
      }
      return data
    },
    onMutate: async ({ sessionId, role, content }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [...apiKeys.session(sessionId), 'messages'],
      })

      // Snapshot previous messages
      const previousMessages = queryClient.getQueryData<Array<Message>>([
        ...apiKeys.session(sessionId),
        'messages',
      ])

      // Optimistically add the new message
      if (previousMessages) {
        const optimisticMessage: Message = {
          id: `temp-${Date.now()}`,
          session_id: sessionId,
          role,
          content,
          created_at: new Date().toISOString(),
        }
        queryClient.setQueryData<Array<Message>>(
          [...apiKeys.session(sessionId), 'messages'],
          [...previousMessages, optimisticMessage],
        )
      }

      return { previousMessages }
    },
    onError: (_, { sessionId }, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          [...apiKeys.session(sessionId), 'messages'],
          context.previousMessages,
        )
      }
    },
    onSettled: (_, __, { sessionId }) => {
      // Refetch to get the real data
      queryClient.invalidateQueries({
        queryKey: [...apiKeys.session(sessionId), 'messages'],
      })
      // Also invalidate the session to update message count
      queryClient.invalidateQueries({
        queryKey: apiKeys.session(sessionId),
      })
    },
  })
}
