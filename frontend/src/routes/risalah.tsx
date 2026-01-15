import { createFileRoute, Link } from '@tanstack/react-router'
import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react'
import { ArrowLeft, Calendar, Lock, MessageSquare, Scroll, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useLatestSummary, useSummaries, useSubscription } from '../hooks'
import type { WeeklySummary } from '../hooks'

export const Route = createFileRoute('/risalah')({
  component: RisalahPage,
})

function RisalahPage() {
  return (
    <>
      <SignedIn>
        <RisalahContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

function RisalahContent() {
  const { data: subscription, isLoading: isLoadingSubscription } = useSubscription()
  const { data: latestSummary, isLoading: isLoadingLatest, error: latestError } = useLatestSummary()
  const { data: summariesData } = useSummaries(10, 0)

  const isPremium = subscription?.plan === 'paid'
  const isPremiumRequired = latestError?.message.includes('PREMIUM_REQUIRED')

  // Show locked state for free users
  if (!isLoadingSubscription && !isPremium) {
    return <LockedState />
  }

  // Loading state
  if (isLoadingSubscription || isLoadingLatest) {
    return <LoadingState />
  }

  // Premium required error
  if (isPremiumRequired) {
    return <LockedState />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-[var(--color-earth-stone)]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            to="/refleksi"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-ui text-sm">Kembali</span>
          </Link>
          <h1 className="font-subheadline text-lg text-foreground">Risalah Mingguan</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Latest Summary (Featured) */}
        {latestSummary ? (
          <section className="mb-12">
            <h2 className="font-subheadline text-sm text-muted-foreground uppercase tracking-wider mb-4">
              Risalah Terbaru
            </h2>
            <FeaturedSummaryCard summary={latestSummary} />
          </section>
        ) : (
          <EmptyState />
        )}

        {/* Past Summaries Timeline */}
        {summariesData && summariesData.summaries.length > 1 && (
          <section>
            <h2 className="font-subheadline text-sm text-muted-foreground uppercase tracking-wider mb-4">
              Risalah Sebelumnya
            </h2>
            <div className="space-y-4">
              {summariesData.summaries.slice(1).map((summary) => (
                <SummaryCard key={summary.id} summary={summary} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="relative mx-auto w-16 h-20 mb-4">
          <Scroll className="w-16 h-20 text-[var(--color-earth-gold)] animate-pulse" />
        </div>
        <p className="font-body text-muted-foreground">Memuat Risalah...</p>
      </div>
    </div>
  )
}

function LockedState() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-[var(--color-earth-stone)]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            to="/refleksi"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-ui text-sm">Kembali</span>
          </Link>
          <h1 className="font-subheadline text-lg text-foreground">Risalah Mingguan</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Locked Card */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--color-earth-stone)] bg-[var(--color-earth-marble)] dark:bg-[var(--color-nature-foliage-dark)]/30">
          {/* Blurred preview background */}
          <div className="absolute inset-0 p-8 blur-sm opacity-50">
            <div className="h-4 w-3/4 bg-[var(--color-earth-stone)] rounded mb-4" />
            <div className="h-4 w-full bg-[var(--color-earth-stone)] rounded mb-2" />
            <div className="h-4 w-5/6 bg-[var(--color-earth-stone)] rounded mb-2" />
            <div className="h-4 w-2/3 bg-[var(--color-earth-stone)] rounded" />
          </div>

          {/* Lock overlay */}
          <div className="relative z-10 p-12 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-earth-gold)]/20 border-2 border-[var(--color-earth-gold)]/40">
              <Lock className="h-10 w-10 text-[var(--color-earth-gold)]" />
            </div>

            <h2 className="font-subheadline text-2xl font-bold text-foreground mb-3">
              Risalah Mingguan Terkunci
            </h2>

            <p className="font-body text-muted-foreground mb-6 max-w-md mx-auto">
              Risalah Mingguan adalah ringkasan emosional dari perjalanan jurnalmu.
              Upgrade ke Premium untuk membuka fitur ini.
            </p>

            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-earth-gold)] to-[var(--color-earth-gold-dim)] px-8 py-3 font-ui font-semibold text-[var(--color-nature-foliage-dark)] shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade ke Premium
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-nature-foliage)]/10 border border-[var(--color-nature-foliage)]/30">
        <Scroll className="h-10 w-10 text-[var(--color-nature-foliage)]" />
      </div>

      <h2 className="font-subheadline text-xl font-bold text-foreground mb-3">
        Belum Ada Risalah
      </h2>

      <p className="font-body text-muted-foreground mb-6 max-w-md mx-auto">
        Mulai menulis di Refleksi untuk mendapatkan ringkasan mingguanmu.
        Risalah akan tersedia setelah minggu pertamamu selesai.
      </p>

      <Link
        to="/refleksi"
        className="inline-flex items-center gap-2 rounded-full bg-[var(--color-nature-foliage)] px-6 py-3 font-ui font-semibold text-white transition-all duration-300 hover:bg-[var(--color-nature-foliage-dark)]"
      >
        Mulai Menulis
      </Link>
    </div>
  )
}

function FeaturedSummaryCard({ summary }: { summary: WeeklySummary }) {
  const weekRange = formatWeekRange(summary.week_start, summary.week_end)
  const emotions = summary.emotions

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--color-earth-gold)] bg-gradient-to-br from-[var(--color-earth-marble)] to-[var(--color-earth-stone)]/30 shadow-xl dark:from-[var(--color-nature-foliage-dark)]/90 dark:to-[hsl(145,50%,10%)]/80">
      {/* Paper texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative wax seal */}
      <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-earth-gold)] to-[var(--color-earth-gold-dim)] flex items-center justify-center shadow-lg">
        <Scroll className="w-6 h-6 text-[var(--color-nature-foliage-dark)]" />
      </div>

      <div className="relative z-10 p-8">
        {/* Date */}
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Calendar size={16} />
          <span className="font-mono text-sm">{weekRange}</span>
        </div>

        {/* Summary text */}
        <blockquote className="font-body text-xl leading-relaxed text-foreground mb-6 italic">
          "{summary.summary}"
        </blockquote>

        {/* Stats row */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar size={14} />
            <span>{summary.session_count} sesi</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare size={14} />
            <span>{summary.message_count} pesan</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendIcon trend={emotions.trend} />
            <span className={getTrendColor(emotions.trend)}>
              {getTrendLabel(emotions.trend)}
            </span>
          </div>
        </div>

        {/* Emotions */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full bg-[var(--color-earth-gold)]/20 text-[var(--color-earth-gold-dim)] font-ui text-sm font-medium border border-[var(--color-earth-gold)]/30">
              {emotions.dominant_emotion}
            </span>
            {emotions.secondary_emotions.map((emotion) => (
              <span
                key={emotion}
                className="px-3 py-1 rounded-full bg-[var(--color-earth-stone)]/50 text-muted-foreground font-ui text-sm"
              >
                {emotion}
              </span>
            ))}
          </div>
        </div>

        {/* Insights */}
        {emotions.insights.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-[var(--color-nature-foliage)]/10 dark:bg-[var(--color-nature-foliage-dark)]/30 border border-[var(--color-nature-foliage)]/20">
            <h4 className="font-ui text-xs text-muted-foreground uppercase tracking-wider mb-2">Insight</h4>
            <ul className="space-y-1">
              {emotions.insights.map((insight, i) => (
                <li key={i} className="font-body text-sm text-foreground">
                  • {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Encouragement */}
        <p className="font-body text-sm text-[var(--color-nature-foliage)] dark:text-[var(--color-nature-sunlight)] italic">
          {emotions.encouragement}
        </p>
      </div>
    </div>
  )
}

function SummaryCard({ summary }: { summary: WeeklySummary }) {
  const weekRange = formatWeekRange(summary.week_start, summary.week_end)
  const emotions = summary.emotions

  return (
    <div className="rounded-xl border border-[var(--color-earth-stone)] bg-[var(--color-earth-marble)] dark:bg-[var(--color-nature-foliage-dark)]/20 p-6 transition-all duration-200 hover:border-[var(--color-earth-gold)]/50 hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar size={14} />
          <span className="font-mono text-xs">{weekRange}</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <TrendIcon trend={emotions.trend} size={12} />
          <span className={getTrendColor(emotions.trend)}>
            {getTrendLabel(emotions.trend)}
          </span>
        </div>
      </div>

      {/* Summary */}
      <p className="font-body text-foreground mb-3 line-clamp-2">
        {summary.summary}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{summary.session_count} sesi</span>
        <span>{summary.message_count} pesan</span>
        <span className="px-2 py-0.5 rounded-full bg-[var(--color-earth-gold)]/10 text-[var(--color-earth-gold-dim)]">
          {emotions.dominant_emotion}
        </span>
      </div>
    </div>
  )
}

function TrendIcon({ trend, size = 14 }: { trend: string; size?: number }) {
  switch (trend) {
    case 'improving':
      return <TrendingUp size={size} className="text-[var(--color-nature-foliage)]" />
    case 'challenging':
      return <TrendingDown size={size} className="text-amber-500" />
    default:
      return <Minus size={size} className="text-muted-foreground" />
  }
}

function getTrendColor(trend: string): string {
  switch (trend) {
    case 'improving':
      return 'text-[var(--color-nature-foliage)]'
    case 'challenging':
      return 'text-amber-500'
    default:
      return 'text-muted-foreground'
  }
}

function getTrendLabel(trend: string): string {
  switch (trend) {
    case 'improving':
      return 'Membaik'
    case 'challenging':
      return 'Menantang'
    default:
      return 'Stabil'
  }
}

function formatWeekRange(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)

  const formatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
  })

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`
}
