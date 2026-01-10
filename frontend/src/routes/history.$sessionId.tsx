import { createFileRoute, Link } from '@tanstack/react-router'
import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react'
import { ArrowLeft, CheckCircle, Clock, Droplets, XCircle, Loader2 } from 'lucide-react'
import { useSession } from '../hooks'
import NotepadChat from '../components/NotepadChat'

export const Route = createFileRoute('/history/$sessionId')({
  component: SessionDetailPage,
})

function SessionDetailPage() {
  return (
    <>
      <SignedIn>
        <SessionDetailContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

function SessionDetailContent() {
  const { sessionId } = Route.useParams()
  const { data, isLoading, error } = useSession(sessionId)

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2
          className="animate-spin text-[var(--color-earth-gold)] mb-4"
          size={48}
        />
        <p className="font-body text-muted-foreground">Memuat sesi...</p>
      </div>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="font-body text-destructive mb-4">
          Sesi tidak ditemukan atau terjadi kesalahan.
        </p>
        <Link
          to="/history"
          className="bg-[var(--color-nature-foliage)] text-white font-ui px-6 py-3 rounded-full"
        >
          Kembali ke Riwayat
        </Link>
      </div>
    )
  }

  const { session, messages } = data

  const date = new Date(session.started_at)
  const formattedDate = date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Status badge configuration
  const statusConfig = {
    completed: {
      label: 'Selesai',
      icon: CheckCircle,
      className: 'bg-[var(--color-nature-foliage)]/20 text-[var(--color-nature-foliage-dark)]',
    },
    active: {
      label: 'Aktif',
      icon: Clock,
      className: 'bg-[var(--color-earth-gold)]/20 text-[var(--color-earth-gold-dark)]',
    },
    abandoned: {
      label: 'Dibatalkan',
      icon: XCircle,
      className: 'bg-red-100 text-red-700',
    },
  }

  const status = statusConfig[session.status]
  const StatusIcon = status.icon

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-[var(--color-earth-stone)]/20 bg-[var(--color-earth-marble)]">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {/* Back link */}
          <Link
            to="/history"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft size={14} />
            Kembali ke Riwayat
          </Link>

          {/* Session info */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <time className="font-mono text-sm text-muted-foreground block mb-1">
                {formattedDate}
              </time>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="font-mono text-xs">
                  {session.total_messages} pesan
                </span>
                {session.golden_ink_earned > 0 && (
                  <span className="font-mono text-xs flex items-center gap-1 text-[var(--color-earth-gold-dark)]">
                    <Droplets size={12} />
                    +{session.golden_ink_earned} Tinta Emas
                  </span>
                )}
              </div>
            </div>

            {/* Status badge */}
            <span
              className={`
                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                font-mono text-xs uppercase tracking-wide shrink-0
                ${status.className}
              `}
            >
              <StatusIcon size={12} />
              {status.label}
            </span>
          </div>
        </div>
      </header>

      {/* Chat content (read-only) */}
      <main className="flex-1 flex flex-col p-4 max-w-2xl mx-auto w-full">
        <NotepadChat
          messages={messages}
          isLoading={false}
          className="flex-1 min-h-0"
        />
      </main>
    </div>
  )
}
