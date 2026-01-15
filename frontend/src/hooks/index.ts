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
export { useTheme, initializeTheme, type Theme } from './useTheme'

// User gamification stats
export { useUserStats } from './useUserStats'

// Subscription (plan status)
export { useSubscription, useCanSendMessage } from './useSubscription'

// Sessions (journaling conversations)
export {
  useCreateSession,
  useSessions,
  useInfiniteSessions,
  useSession,
  useUpdateSession,
} from './useSessions'

// Messages (within sessions)
export { useMessages, useSendMessage } from './useMessages'

// AI interactions (Sang Pujangga)
export { useStartSession, useAIRespond, useTodaySession } from './useAI'

// Weekly Summaries (Risalah Mingguan)
export { useSummaries, useLatestSummary } from './useSummaries'

// Re-export types for convenience
export type {
  UserStats,
  Session,
  SessionWithPreview,
  SessionStatus,
  Message,
  Artwork,
  UserArtwork,
  UserArtworkStatus,
  UserArtworkWithDetails,
  WeeklySummary,
  WeeklySummaryEmotions,
  ListSummariesResponse,
  SessionRewards,
  AIRespondResponse,
  StartSessionResponse,
  TodaySessionResponse,
  SubscriptionStatus,
  SubscriptionPlan,
  LimitReachedError,
} from '../lib/api'

// Re-export apiKeys for custom queries
export { apiKeys } from '../lib/api'
