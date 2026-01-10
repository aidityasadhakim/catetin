import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useUserStats } from '../hooks/useUserStats'

/**
 * Pixel-art style XP segments for the progress bar
 * Each segment represents a portion of the level progress
 */
const XP_SEGMENTS = 10

/**
 * Tooltip component for stats display
 */
function Tooltip({
  children,
  content,
}: {
  children: React.ReactNode
  content: React.ReactNode
}) {
  const [show, setShow] = useState(false)
  const [position, setPosition] = useState<'top' | 'bottom'>('top')
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (show && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      // Show below if too close to top of viewport
      setPosition(rect.top < 80 ? 'bottom' : 'top')
    }
  }, [show])

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className={`absolute z-50 px-3 py-2 text-xs font-mono whitespace-nowrap
            bg-card/95 border border-border rounded
            shadow-lg animate-in fade-in-0 zoom-in-95 duration-150
            ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
            left-1/2 -translate-x-1/2`}
        >
          {content}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-card border-border rotate-45
              ${position === 'top' ? 'bottom-[-5px] border-r border-b' : 'top-[-5px] border-l border-t'}`}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Pixel-art segmented XP progress bar
 */
function XPBar({
  progress,
  isGlowing,
}: {
  progress: number
  isGlowing: boolean
}) {
  const filledSegments = Math.floor((progress / 100) * XP_SEGMENTS)
  const partialFill = ((progress / 100) * XP_SEGMENTS) % 1

  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: XP_SEGMENTS }).map((_, i) => {
        const isFilled = i < filledSegments
        const isPartial = i === filledSegments && partialFill > 0

        return (
          <div
            key={i}
            className={`w-[6px] h-[8px] border border-earth-gold-dim/40 transition-all duration-300
              ${isFilled ? 'bg-earth-gold' : isPartial ? 'bg-earth-gold/50' : 'bg-muted/30'}
              ${isGlowing && isFilled ? 'animate-pulse shadow-[0_0_4px_var(--color-earth-gold)]' : ''}
            `}
            style={{
              boxShadow: isGlowing && isFilled ? '0 0 6px hsl(45, 85%, 65%)' : undefined,
            }}
          />
        )
      })}
    </div>
  )
}

/**
 * Tinta Emas (Golden Ink) icon - stylized ink drop/feather
 */
function TintaEmasIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ink drop shape */}
      <path
        d="M8 2L4 8C4 11 5.5 13 8 13C10.5 13 12 11 12 8L8 2Z"
        fill="currentColor"
        className="text-earth-gold"
      />
      {/* Highlight */}
      <ellipse cx="6.5" cy="8" rx="1" ry="1.5" fill="white" opacity="0.4" />
    </svg>
  )
}

/**
 * Marmer (Marble) icon - stylized stone/gem
 */
function MarmerIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Diamond/gem shape */}
      <path d="M8 1L14 6L8 15L2 6L8 1Z" fill="currentColor" className="text-muted-foreground" />
      {/* Facets */}
      <path d="M8 1L8 15M2 6L14 6" stroke="white" strokeWidth="0.5" opacity="0.3" />
      {/* Top highlight */}
      <path d="M5 4L8 1L11 4" stroke="white" strokeWidth="0.5" opacity="0.5" />
    </svg>
  )
}

/**
 * Streak/fire icon
 */
function StreakIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Flame shape */}
      <path
        d="M8 1C8 1 5 5 5 8C5 10.5 6.5 12 8 13C9.5 12 11 10.5 11 8C11 5 8 1 8 1Z"
        fill="currentColor"
        className="text-orange-500"
      />
      {/* Inner flame */}
      <path
        d="M8 6C8 6 6.5 8 6.5 9.5C6.5 10.5 7 11.5 8 12C9 11.5 9.5 10.5 9.5 9.5C9.5 8 8 6 8 6Z"
        fill="currentColor"
        className="text-amber-400"
      />
    </svg>
  )
}

/**
 * Loading skeleton for stats bar
 */
function StatsBarSkeleton() {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      {/* Level badge skeleton */}
      <div className="w-8 h-6 bg-muted rounded" />
      {/* XP bar skeleton */}
      <div className="hidden sm:flex gap-[2px]">
        {Array.from({ length: XP_SEGMENTS }).map((_, i) => (
          <div key={i} className="w-[6px] h-[8px] bg-muted rounded-sm" />
        ))}
      </div>
      {/* Resources skeleton */}
      <div className="hidden sm:flex items-center gap-2">
        <div className="w-10 h-4 bg-muted rounded" />
        <div className="w-10 h-4 bg-muted rounded" />
      </div>
    </div>
  )
}

/**
 * Main UserStatsBar component
 * Displays XP bar, level, and resources in the navbar
 */
export default function UserStatsBar() {
  const { isSignedIn } = useAuth()
  const { data: stats, isLoading } = useUserStats()
  const [isGlowing, setIsGlowing] = useState(false)
  const prevXPRef = useRef<number | null>(null)

  // Glow effect when XP increases
  useEffect(() => {
    if (stats && prevXPRef.current !== null) {
      if (stats.current_xp > prevXPRef.current || stats.level > 1) {
        setIsGlowing(true)
        const timer = setTimeout(() => setIsGlowing(false), 2000)
        return () => clearTimeout(timer)
      }
    }
    if (stats) {
      prevXPRef.current = stats.current_xp
    }
  }, [stats?.current_xp, stats?.level])

  // Don't render if not signed in
  if (!isSignedIn) return null

  // Show skeleton while loading
  if (isLoading || !stats) {
    return <StatsBarSkeleton />
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Level Badge with XP tooltip */}
      <Tooltip
        content={
          <div className="text-center">
            <div className="font-ui text-sm mb-1">Level {stats.level}</div>
            <div className="text-muted-foreground">
              {stats.current_xp} / {stats.current_xp + stats.xp_to_next_level} XP
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.xp_to_next_level} XP to next level
            </div>
          </div>
        }
      >
        <div
          className={`flex items-center gap-1 px-2 py-0.5 bg-card/80 border border-border rounded
            font-ui text-xs tracking-wide transition-all duration-300
            ${isGlowing ? 'border-earth-gold shadow-[0_0_8px_hsl(45,85%,65%,0.5)]' : ''}
          `}
        >
          <span className="text-muted-foreground text-[10px]">Lv</span>
          <span className="font-mono font-semibold">{stats.level}</span>
        </div>
      </Tooltip>

      {/* XP Progress Bar - hidden on mobile */}
      <div className="hidden sm:block">
        <Tooltip
          content={
            <div className="text-center">
              <div className="font-mono">{stats.level_progress}% complete</div>
              <div className="text-muted-foreground text-[10px] mt-0.5">
                Total XP: {stats.total_xp}
              </div>
            </div>
          }
        >
          <XPBar progress={stats.level_progress} isGlowing={isGlowing} />
        </Tooltip>
      </div>

      {/* Divider - hidden on mobile */}
      <div className="hidden sm:block w-px h-4 bg-border" />

      {/* Resources */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Tinta Emas */}
        <Tooltip
          content={
            <div className="text-center">
              <div className="font-ui text-sm">Tinta Emas</div>
              <div className="text-muted-foreground text-xs">Golden Ink for art reveals</div>
            </div>
          }
        >
          <div className="flex items-center gap-1">
            <TintaEmasIcon className="w-4 h-4" />
            <span className="font-mono text-xs font-medium">{formatNumber(stats.golden_ink)}</span>
          </div>
        </Tooltip>

        {/* Marmer - hidden on small mobile */}
        <Tooltip
          content={
            <div className="text-center">
              <div className="font-ui text-sm">Marmer</div>
              <div className="text-muted-foreground text-xs">Marble from streaks</div>
            </div>
          }
        >
          <div className="hidden xs:flex items-center gap-1">
            <MarmerIcon className="w-4 h-4" />
            <span className="font-mono text-xs font-medium">{formatNumber(stats.marble)}</span>
          </div>
        </Tooltip>

        {/* Streak - shown if active */}
        {stats.current_streak > 0 && (
          <Tooltip
            content={
              <div className="text-center">
                <div className="font-ui text-sm">Streak</div>
                <div className="text-muted-foreground text-xs">
                  {stats.current_streak} day{stats.current_streak !== 1 ? 's' : ''} in a row
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Best: {stats.longest_streak} days
                </div>
              </div>
            }
          >
            <div className="hidden sm:flex items-center gap-0.5">
              <StreakIcon className="w-4 h-4" />
              <span className="font-mono text-xs font-medium">{stats.current_streak}</span>
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  )
}

/**
 * Format large numbers with K suffix
 */
function formatNumber(num: number): string {
  if (num >= 10000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}
