import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react'
import { useEffect, useRef } from 'react'
import { BookOpen, Loader2, PenLine } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useInfiniteSessions } from '../hooks'
import SessionCard from '../components/SessionCard'

export const Route = createFileRoute('/history')({
  component: HistoryPage,
})

function HistoryPage() {
  return (
    <>
      <SignedIn>
        <HistoryContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

function HistoryContent() {
  const navigate = useNavigate()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteSessions(20)

  // Flatten all sessions from all pages
  const sessions = data?.pages.flatMap((page) => page.sessions) ?? []

  // Check if a session is from today
  const isToday = (dateString: string) => {
    const sessionDate = new Date(dateString).toDateString()
    const today = new Date().toDateString()
    return sessionDate === today
  }

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Handle session click
  const handleSessionClick = (sessionId: string, isActive: boolean, isTodaySession: boolean) => {
    // If it's today's active session, redirect to journal
    if (isActive && isTodaySession) {
      navigate({ to: '/refleksi' })
    } else {
      navigate({ to: '/history/$sessionId', params: { sessionId } })
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2
          className="animate-spin text-[var(--color-earth-gold)] mb-4"
          size={48}
        />
        <p className="font-body text-muted-foreground">Memuat riwayat...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="font-body text-destructive mb-4">
          Terjadi kesalahan saat memuat riwayat.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[var(--color-nature-foliage)] text-white font-ui px-6 py-3 rounded-full"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  // Empty state
  if (sessions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <BookOpen
            size={64}
            className="mx-auto mb-6 text-[var(--color-earth-stone)]"
          />
          <h2 className="font-subheading text-xl text-foreground mb-3">
            Belum Ada Riwayat
          </h2>
          <p className="font-body text-muted-foreground mb-8 leading-relaxed">
            Kamu belum memiliki catatan refleksi. Mulai perjalanan refleksimu
            hari ini dan biarkan Sang Pujangga menemanimu.
          </p>
          <Link
            to="/refleksi"
            className="inline-flex items-center gap-2 bg-[var(--color-nature-foliage)] text-white font-ui px-8 py-3 rounded-full hover:bg-[var(--color-nature-foliage-dark)] transition-colors"
          >
            <PenLine size={18} />
            Mulai Menulis
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Page header */}
        <header className="text-center mb-10">
          <h1 className="font-subheading text-2xl sm:text-3xl text-foreground tracking-wide mb-2">
            Riwayat Refleksi
          </h1>
          <p className="font-body text-muted-foreground">
            {sessions.length} sesi tercatat
          </p>
        </header>

        {/* Sessions list */}
        <div className="space-y-4">
          {sessions.map((session) => {
            const isTodaySession = isToday(session.started_at)
            return (
              <SessionCard
                key={session.id}
                session={session}
                isToday={isTodaySession}
                onClick={() =>
                  handleSessionClick(
                    session.id,
                    session.status === 'active',
                    isTodaySession,
                  )
                }
              />
            )
          })}
        </div>

        {/* Load more trigger */}
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {isFetchingNextPage && (
            <Loader2
              className="animate-spin text-[var(--color-earth-gold)]"
              size={24}
            />
          )}
          {!hasNextPage && sessions.length > 0 && (
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-wide">
              Semua riwayat telah ditampilkan
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
