/**
 * Catetin API Hooks
 *
 * This module exports TanStack Query hooks for all API endpoints.
 * Import hooks from here, not from individual files.
 *
 * @example
 * import { useUserStats, useSessions, useSession, useAIRespond } from '@/hooks'
 */

// Utility hooks
export { useIsMobile } from './useIsMobile'

// User gamification stats
export { useUserStats } from './useUserStats'

// Sessions (journaling conversations)
export {
  useCreateSession,
  useSessions,
  useSession,
  useUpdateSession,
} from './useSessions'

// Messages (within sessions)
export { useMessages, useSendMessage } from './useMessages'

// AI interactions (Sang Pujangga)
export { useStartSession, useAIRespond, useTodaySession } from './useAI'

// Re-export types for convenience
export type {
  UserStats,
  Session,
  SessionStatus,
  Message,
  Artwork,
  UserArtwork,
  UserArtworkStatus,
  UserArtworkWithDetails,
  WeeklySummary,
  SessionRewards,
  AIRespondResponse,
  StartSessionResponse,
  TodaySessionResponse,
} from '../lib/api'

// Re-export apiKeys for custom queries
export { apiKeys } from '../lib/api'
