/**
 * useSessions - TanStack Query hooks for journaling sessions
 *
 * Provides hooks for:
 * - Creating new sessions
 * - Listing user's sessions
 * - Getting a single session with messages
 * - Updating session status
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { apiKeys, useApiClient } from '../lib/api'
import type { Message, Session } from '../lib/api'

// Response types
interface SessionsListResponse {
  sessions: Array<Session>
  limit: number
  offset: number
}

interface SessionWithMessages {
  session: Session
  messages: Array<Message>
}

/**
 * Creates a new journaling session.
 *
 * @example
 * const { mutate: createSession, isPending } = useCreateSession()
 * createSession(undefined, {
 *   onSuccess: (session) => navigate(`/refleksi/${session.id}`)
 * })
 */
export function useCreateSession() {
  const api = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<Session> => {
      const { data, error } = await api.post<Session>('/api/sessions')
      if (error) {
        throw new Error(error)
      }
      if (!data) {
        throw new Error('No data returned from create session endpoint')
      }
      return data
    },
    onSuccess: () => {
      // Invalidate sessions list to include the new session
      queryClient.invalidateQueries({ queryKey: apiKeys.sessions() })
    },
  })
}

/**
 * Fetches a paginated list of the user's journaling sessions.
 *
 * @param limit - Number of sessions per page (default: 20)
 * @param offset - Pagination offset (default: 0)
 *
 * @example
 * const { data, isLoading } = useSessions()
 * if (data) {
 *   data.sessions.map(session => ...)
 * }
 */
export function useSessions(limit = 20, offset = 0) {
  const api = useApiClient()
  const { isSignedIn } = useAuth()

  return useQuery({
    queryKey: [...apiKeys.sessions(), { limit, offset }],
    queryFn: async (): Promise<SessionsListResponse> => {
      const { data, error } = await api.get<SessionsListResponse>(
        `/api/sessions?limit=${limit}&offset=${offset}`
      )
      if (error) {
        throw new Error(error)
      }
      if (!data) {
        throw new Error('No data returned from sessions endpoint')
      }
      return data
    },
    enabled: !!isSignedIn,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Fetches a single session with all its messages.
 *
 * @param sessionId - The session UUID
 *
 * @example
 * const { data, isLoading } = useSession(sessionId)
 * if (data) {
 *   const { session, messages } = data
 * }
 */
export function useSession(sessionId: string | undefined) {
  const api = useApiClient()
  const { isSignedIn } = useAuth()

  return useQuery({
    queryKey: apiKeys.session(sessionId ?? ''),
    queryFn: async (): Promise<SessionWithMessages> => {
      const { data, error } = await api.get<SessionWithMessages>(
        `/api/sessions/${sessionId}`
      )
      if (error) {
        throw new Error(error)
      }
      if (!data) {
        throw new Error('No data returned from session endpoint')
      }
      return data
    },
    enabled: !!isSignedIn && !!sessionId,
    staleTime: 10 * 1000, // 10 seconds - sessions with messages need fresher data
  })
}

/**
 * Updates a session's status (complete or abandon).
 *
 * @example
 * const { mutate: updateSession } = useUpdateSession()
 * updateSession({ sessionId, status: 'completed' })
 */
export function useUpdateSession() {
  const api = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      status,
    }: {
      sessionId: string
      status: 'completed' | 'abandoned'
    }): Promise<Session> => {
      const { data, error } = await api.put<Session>(
        `/api/sessions/${sessionId}`,
        { status }
      )
      if (error) {
        throw new Error(error)
      }
      if (!data) {
        throw new Error('No data returned from update session endpoint')
      }
      return data
    },
    onSuccess: (_, { sessionId }) => {
      // Invalidate both the specific session and the list
      queryClient.invalidateQueries({ queryKey: apiKeys.session(sessionId) })
      queryClient.invalidateQueries({ queryKey: apiKeys.sessions() })
    },
  })
}
