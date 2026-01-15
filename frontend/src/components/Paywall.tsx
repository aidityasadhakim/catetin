import { Link } from '@tanstack/react-router'
import { Lock, Sparkles } from 'lucide-react'

interface PaywallProps {
  messagesUsed: number
  messageLimit: number
  supportEmail?: string
}

/**
 * Paywall component shown when free user reaches daily message limit.
 * Designed with Renaissance aesthetic - glassmorphism card with gold accents.
 */
export default function Paywall({
  messagesUsed,
  messageLimit,
  supportEmail = 'support@catetin.app',
}: PaywallProps) {
  return (
    <div className="relative my-6 animate-[fadeIn_0.5s_ease-out]">
      {/* Glassmorphism card */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--color-earth-gold)]/50 bg-gradient-to-br from-[var(--color-earth-marble)]/90 to-[var(--color-earth-stone)]/80 backdrop-blur-md shadow-xl dark:from-[var(--color-nature-foliage-dark)]/90 dark:to-[hsl(145,50%,10%)]/80">
        {/* Decorative corner elements */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-[var(--color-earth-gold)] rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-[var(--color-earth-gold)] rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-[var(--color-earth-gold)] rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-[var(--color-earth-gold)] rounded-br-2xl" />

        <div className="relative z-10 p-6 text-center">
          {/* Lock icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-earth-gold)]/20 border border-[var(--color-earth-gold)]/40">
            <Lock className="h-7 w-7 text-[var(--color-earth-gold-dim)]" />
          </div>

          {/* Headline */}
          <h3 className="font-subheadline text-xl font-bold text-foreground mb-2">
            Refleksimu Hari Ini Sudah Selesai
          </h3>

          {/* Message count */}
          <p className="font-body text-muted-foreground mb-4">
            Kamu telah menulis{' '}
            <span className="font-mono text-[var(--color-earth-gold-dim)] font-semibold">
              {messagesUsed}/{messageLimit}
            </span>{' '}
            pesan hari ini.
          </p>

          {/* Value proposition */}
          <p className="font-body text-foreground mb-6">
            Upgrade ke{' '}
            <span className="font-ui text-[var(--color-earth-gold-dim)] font-semibold">
              Premium
            </span>{' '}
            untuk refleksi tanpa batas dan akses{' '}
            <span className="italic">Risalah Mingguan</span>.
          </p>

          {/* CTA Button */}
          <Link
            to="/pricing"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-earth-gold)] to-[var(--color-earth-gold-dim)] px-8 py-3 font-ui font-semibold text-[var(--color-nature-foliage-dark)] shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 hover:from-[var(--color-earth-gold-dim)] hover:to-[var(--color-earth-gold)]"
          >
            <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
            Upgrade Sekarang - Rp 50.000
          </Link>

          {/* Lifetime badge */}
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            Sekali bayar, selamanya
          </p>

          {/* Support link */}
          <p className="mt-4 text-sm text-muted-foreground">
            Ada masalah pembayaran?{' '}
            <a
              href={`mailto:${supportEmail}`}
              className="text-[var(--color-nature-foliage)] hover:underline dark:text-[var(--color-nature-sunlight)]"
            >
              Hubungi kami
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
