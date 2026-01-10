import { CheckCircle, Clock, Droplets, XCircle } from 'lucide-react'
import type { SessionWithPreview } from '../hooks'

interface SessionCardProps {
  session: SessionWithPreview
  onClick?: () => void
  isToday?: boolean
}

export default function SessionCard({
  session,
  onClick,
  isToday = false,
}: SessionCardProps) {
  const date = new Date(session.started_at)
  const formattedDate = date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const formattedTime = date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
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

  // Truncate preview message
  const previewText = session.first_user_message
    ? session.first_user_message.length > 120
      ? session.first_user_message.slice(0, 120) + '...'
      : session.first_user_message
    : 'Belum ada pesan'

  return (
    <button
      onClick={onClick}
      className="w-full text-left group"
      aria-label={`Sesi ${formattedDate}`}
    >
      <article
        className={`
          relative rounded-xl p-5 transition-all duration-200
          bg-[var(--color-earth-marble)] border border-[var(--color-earth-stone)]/30
          hover:border-[var(--color-earth-gold)]/50 hover:shadow-md
          ${isToday ? 'ring-2 ring-[var(--color-earth-gold)]/30' : ''}
        `}
      >
        {/* Date header */}
        <header className="flex items-center justify-between mb-3">
          <div>
            <time className="font-mono text-xs text-muted-foreground tracking-wide">
              {formattedDate}
            </time>
            <span className="font-mono text-xs text-muted-foreground/50 ml-2">
              {formattedTime}
            </span>
          </div>

          {/* Status badge */}
          <span
            className={`
              inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
              font-mono text-xs uppercase tracking-wide
              ${status.className}
            `}
          >
            <StatusIcon size={12} />
            {status.label}
          </span>
        </header>

        {/* Preview text */}
        <p className="font-body text-foreground leading-relaxed mb-4 line-clamp-2">
          "{previewText}"
        </p>

        {/* Stats footer */}
        <footer className="flex items-center gap-4 text-muted-foreground">
          <span className="font-mono text-xs flex items-center gap-1">
            {session.total_messages} pesan
          </span>

          {session.golden_ink_earned > 0 && (
            <span className="font-mono text-xs flex items-center gap-1 text-[var(--color-earth-gold-dark)]">
              <Droplets size={12} />
              +{session.golden_ink_earned} Tinta Emas
            </span>
          )}
        </footer>

        {/* Today indicator */}
        {isToday && (
          <div className="absolute -top-2 -right-2 bg-[var(--color-earth-gold)] text-white font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">
            Hari Ini
          </div>
        )}
      </article>
    </button>
  )
}
