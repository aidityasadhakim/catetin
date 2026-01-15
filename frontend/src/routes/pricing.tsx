import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Check, ExternalLink, Sparkles } from 'lucide-react'

export const Route = createFileRoute('/pricing')({
  component: PricingPage,
})

const TRAKTEER_URL = 'https://trakteer.id/catetin/tip'

function PricingPage() {
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
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl text-[var(--color-nature-foliage-dark)] dark:text-[var(--color-earth-gold)] mb-4">
            Upgrade ke Premium
          </h1>
          <p className="font-body text-xl text-muted-foreground max-w-2xl mx-auto">
            Refleksi tanpa batas, akses Risalah Mingguan, dan dukung pengembangan Catetin.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto">
          <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--color-earth-gold)] bg-gradient-to-br from-[var(--color-earth-marble)] to-[var(--color-earth-stone)]/50 shadow-xl dark:from-[var(--color-nature-foliage-dark)]/90 dark:to-[hsl(145,50%,10%)]/80">
            {/* Badge */}
            <div className="absolute top-0 right-0 bg-[var(--color-earth-gold)] text-[var(--color-nature-foliage-dark)] font-ui font-bold px-4 py-1 rounded-bl-lg text-sm">
              Selamanya
            </div>

            <div className="p-8">
              {/* Price */}
              <div className="text-center mb-8">
                <div className="inline-flex items-baseline gap-1">
                  <span className="font-body text-lg text-muted-foreground">Rp</span>
                  <span className="font-subheadline text-5xl font-bold text-foreground">50.000</span>
                </div>
                <p className="font-mono text-sm text-muted-foreground mt-2">
                  Sekali bayar, akses selamanya
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[var(--color-nature-foliage)] shrink-0 mt-0.5" />
                  <span className="font-body text-foreground">
                    <strong>Refleksi tanpa batas</strong> — kirim pesan sepuasnya setiap hari
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[var(--color-nature-foliage)] shrink-0 mt-0.5" />
                  <span className="font-body text-foreground">
                    <strong>Risalah Mingguan</strong> — ringkasan emosional dari perjalananmu
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[var(--color-nature-foliage)] shrink-0 mt-0.5" />
                  <span className="font-body text-foreground">
                    <strong>Dukung pengembangan</strong> — bantu kami terus membuat Catetin lebih baik
                  </span>
                </li>
              </ul>

              {/* CTA */}
              <a
                href={TRAKTEER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-earth-gold)] to-[var(--color-earth-gold-dim)] px-8 py-4 font-ui font-bold text-lg text-[var(--color-nature-foliage-dark)] shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:from-[var(--color-earth-gold-dim)] hover:to-[var(--color-earth-gold)]"
              >
                <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" />
                Upgrade via Trakteer
                <ExternalLink className="h-4 w-4 opacity-70" />
              </a>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="max-w-2xl mx-auto mt-12 p-6 rounded-xl bg-[var(--color-earth-marble)]/50 dark:bg-[var(--color-nature-foliage-dark)]/30 border border-[var(--color-earth-stone)]">
          <h2 className="font-subheadline text-lg font-bold text-foreground mb-4">
            Cara Upgrade:
          </h2>
          <ol className="space-y-3 font-body text-foreground">
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--color-nature-foliage)] text-white flex items-center justify-center text-sm font-bold">1</span>
              <span>Klik tombol "Upgrade via Trakteer" di atas</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--color-nature-foliage)] text-white flex items-center justify-center text-sm font-bold">2</span>
              <span>Pilih <strong>10 Cendol</strong> (Rp 50.000)</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--color-nature-foliage)] text-white flex items-center justify-center text-sm font-bold">3</span>
              <span>
                <strong>PENTING:</strong> Gunakan email yang sama dengan akun Catetin-mu sebagai "supporter email"
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--color-nature-foliage)] text-white flex items-center justify-center text-sm font-bold">4</span>
              <span>Selesaikan pembayaran — akunmu akan otomatis ter-upgrade dalam beberapa menit!</span>
            </li>
          </ol>
        </div>

        {/* Support */}
        <div className="text-center mt-8">
          <p className="font-body text-muted-foreground">
            Ada masalah atau pertanyaan?{' '}
            <a
              href="mailto:support@catetin.app"
              className="text-[var(--color-nature-foliage)] hover:underline dark:text-[var(--color-nature-sunlight)]"
            >
              Hubungi kami
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
