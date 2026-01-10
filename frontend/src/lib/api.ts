import { useAuth } from '@clerk/clerk-react'
import { useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>
}

interface ApiResponse<T> {
  data: T | null
  error: string | null
  status: number
}

/**
 * Hook that returns an API client with automatic auth token handling
 */
export function useApiClient() {
  const { getToken, isSignedIn } = useAuth()

  const request = useCallback(
    async <T>(
      endpoint: string,
      options?: RequestOptions
    ): Promise<ApiResponse<T>> => {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...options?.headers,
        }

        // Add auth token if signed in
        if (isSignedIn) {
          const token = await getToken()
          if (token) {
            headers['Authorization'] = `Bearer ${token}`
          }
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers,
        })

        // Handle 401 - could trigger re-auth flow
        if (response.status === 401) {
          return {
            data: null,
            error: 'Unauthorized - please sign in again',
            status: 401,
          }
        }

        // Parse JSON response
        const data = await response.json()

        if (!response.ok) {
          return {
            data: null,
            error: data.message || data.error || 'Request failed',
            status: response.status,
          }
        }

        return {
          data,
          error: null,
          status: response.status,
        }
      } catch (err) {
        return {
          data: null,
          error: err instanceof Error ? err.message : 'Network error',
          status: 0,
        }
      }
    },
    [getToken, isSignedIn]
  )

  const get = useCallback(
    <T>(endpoint: string, options?: RequestOptions) =>
      request<T>(endpoint, { ...options, method: 'GET' }),
    [request]
  )

  const post = useCallback(
    <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
      request<T>(endpoint, {
        ...options,
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      }),
    [request]
  )

  const put = useCallback(
    <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
      request<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      }),
    [request]
  )

  const patch = useCallback(
    <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
      request<T>(endpoint, {
        ...options,
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      }),
    [request]
  )

  const del = useCallback(
    <T>(endpoint: string, options?: RequestOptions) =>
      request<T>(endpoint, { ...options, method: 'DELETE' }),
    [request]
  )

  return { request, get, post, put, patch, delete: del }
}

/**
 * Create query key factory for React Query
 *
 * Pattern: Each resource gets a base key and specific key factories.
 * Use these keys with useQuery/useMutation for consistent cache management.
 */
export const apiKeys = {
  all: ['api'] as const,
  health: () => [...apiKeys.all, 'health'] as const,
  entries: () => [...apiKeys.all, 'entries'] as const,
  entry: (id: string) => [...apiKeys.entries(), id] as const,
  // User stats (gamification resources)
  stats: () => [...apiKeys.all, 'stats'] as const,
  // Sessions (journaling conversations)
  sessions: () => [...apiKeys.all, 'sessions'] as const,
  session: (id: string) => [...apiKeys.sessions(), id] as const,
  sessionActive: () => [...apiKeys.sessions(), 'active'] as const,
  // Artworks (gallery)
  artworks: () => [...apiKeys.all, 'artworks'] as const,
  artwork: (id: string) => [...apiKeys.artworks(), id] as const,
  userArtworks: () => [...apiKeys.all, 'user-artworks'] as const,
  userArtwork: (artworkId: string) => [...apiKeys.userArtworks(), artworkId] as const,
  currentArtwork: () => [...apiKeys.userArtworks(), 'current'] as const,
  // Weekly summaries
  weeklySummaries: () => [...apiKeys.all, 'weekly-summaries'] as const,
  weeklySummary: (weekStart: string) => [...apiKeys.weeklySummaries(), weekStart] as const,
}

// Type definitions for API responses
export interface HealthResponse {
  status: string
  time: string
}

export interface JournalEntry {
  id: string
  user_id: string
  title: string
  content: string
  mood?: string
  tags: Array<string>
  created_at: string
  updated_at: string
}

export interface EntriesListResponse {
  entries: Array<JournalEntry>
  total: number
}

/**
 * User stats for gamification (Tinta Emas & Marmer)
 * Matches backend user_stats table
 */
export interface UserStats {
  user_id: string
  golden_ink: number
  marble: number
  current_streak: number
  longest_streak: number
  last_active_date: string | null
  created_at: string
  updated_at: string
}

/**
 * Session status enum
 */
export type SessionStatus = 'active' | 'completed' | 'abandoned'

/**
 * Journaling session with Sang Pujangga
 */
export interface Session {
  id: string
  user_id: string
  status: SessionStatus
  total_messages: number
  golden_ink_earned: number
  started_at: string
  ended_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Message in a journaling session
 */
export interface Message {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

/**
 * Artwork in the gallery
 */
export interface Artwork {
  id: string
  name: string
  display_name: string
  description: string
  image_url: string
  unlock_cost: number
  reveal_cost: number
  created_at: string
}

/**
 * User's progress on an artwork
 */
export type UserArtworkStatus = 'in_progress' | 'completed'

export interface UserArtwork {
  id: string
  user_id: string
  artwork_id: string
  progress: number
  status: UserArtworkStatus
  unlocked_at: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

/**
 * User artwork with joined artwork details
 */
export interface UserArtworkWithDetails extends UserArtwork {
  name: string
  display_name: string
  description: string
  image_url: string
  unlock_cost: number
  reveal_cost: number
}

/**
 * Weekly emotional summary (Risalah Mingguan)
 */
export interface WeeklySummary {
  id: string
  user_id: string
  week_start: string
  week_end: string
  summary: string
  session_count: number
  message_count: number
  emotions: Array<string>
  created_at: string
}

/**
 * Rewards earned from a session
 */
export interface SessionRewards {
  tinta_emas: number
  marmer: number
  new_streak: number
}

/**
 * Response from the AI respond endpoint
 */
export interface AIRespondResponse {
  message: Message
  turn_number: number
  is_complete: boolean
  rewards: SessionRewards | null
  user_message: Message
}

/**
 * Response from starting a new session with AI
 */
export interface StartSessionResponse {
  session: Session
  opening_message: Message | null
}
