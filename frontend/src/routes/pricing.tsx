import { Link, createFileRoute } from '@tanstack/react-router'
import { useUser } from '@clerk/clerk-react'
import { useState } from 'react'
import { ArrowLeft, Check, Copy, ExternalLink, HelpCircle, Minus, Sparkles } from 'lucide-react'

export const Route = createFileRoute('/pricing')({
  component: PricingPage,
})

const TRAKTEER_URL = import.meta.env.VITE_TRAKTEER_URL || 'https://trakteer.id/catetin/tip'
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'support@catetin.app'

function PricingPage() {
  const { user } = useUser()
  const userEmail = user?.primaryEmailAddress?.emailAddress || ''
  const [copied, setCopied] = useState(false)

  const copyEmail = async () => {
    if (!userEmail) return
    await navigator.clipboard.writeText(userEmail)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

        {/* Comparison Table */}
        <div className="max-w-3xl mx-auto mb-12 overflow-hidden rounded-2xl border border-[var(--color-earth-stone)] shadow-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--color-earth-stone)]/30 dark:bg-[var(--color-nature-foliage-dark)]/50">
                <th className="py-4 px-6 text-left font-subheadline text-foreground">Fitur</th>
                <th className="py-4 px-6 text-center font-subheadline text-foreground">Gratis</th>
                <th className="py-4 px-6 text-center font-subheadline text-[var(--color-earth-gold)]">
                  Premium
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-earth-stone)]/50">
              <tr className="bg-[var(--color-earth-marble)] dark:bg-[var(--color-nature-foliage-dark)]/20">
                <td className="py-4 px-6 font-body text-foreground">Pesan per hari</td>
                <td className="py-4 px-6 text-center font-mono text-muted-foreground">3</td>
                <td className="py-4 px-6 text-center font-mono text-[var(--color-earth-gold)]">Tanpa batas</td>
              </tr>
              <tr className="bg-[var(--color-earth-marble)] dark:bg-[var(--color-nature-foliage-dark)]/20">
                <td className="py-4 px-6 font-body text-foreground">AI Companion (Sang Pujangga)</td>
                <td className="py-4 px-6 text-center">
                  <Check className="h-5 w-5 text-[var(--color-nature-foliage)] mx-auto" />
                </td>
                <td className="py-4 px-6 text-center">
                  <Check className="h-5 w-5 text-[var(--color-earth-gold)] mx-auto" />
                </td>
              </tr>
              <tr className="bg-[var(--color-earth-marble)] dark:bg-[var(--color-nature-foliage-dark)]/20">
                <td className="py-4 px-6 font-body text-foreground">Gamifikasi (Tinta Emas & Marmer)</td>
                <td className="py-4 px-6 text-center">
                  <Check className="h-5 w-5 text-[var(--color-nature-foliage)] mx-auto" />
                </td>
                <td className="py-4 px-6 text-center">
                  <Check className="h-5 w-5 text-[var(--color-earth-gold)] mx-auto" />
                </td>
              </tr>
              <tr className="bg-[var(--color-earth-marble)] dark:bg-[var(--color-nature-foliage-dark)]/20">
                <td className="py-4 px-6 font-body text-foreground">Galeri Mahakarya</td>
                <td className="py-4 px-6 text-center">
                  <Check className="h-5 w-5 text-[var(--color-nature-foliage)] mx-auto" />
                </td>
                <td className="py-4 px-6 text-center">
                  <Check className="h-5 w-5 text-[var(--color-earth-gold)] mx-auto" />
                </td>
              </tr>
              <tr className="bg-[var(--color-earth-marble)] dark:bg-[var(--color-nature-foliage-dark)]/20">
                <td className="py-4 px-6 font-body text-foreground">Risalah Mingguan</td>
                <td className="py-4 px-6 text-center">
                  <Minus className="h-5 w-5 text-muted-foreground mx-auto" />
                </td>
                <td className="py-4 px-6 text-center">
                  <Check className="h-5 w-5 text-[var(--color-earth-gold)] mx-auto" />
                </td>
              </tr>
              <tr className="bg-[var(--color-earth-marble)] dark:bg-[var(--color-nature-foliage-dark)]/20">
                <td className="py-4 px-6 font-body text-foreground">Harga</td>
                <td className="py-4 px-6 text-center font-mono text-muted-foreground">Rp 0</td>
                <td className="py-4 px-6 text-center font-mono font-bold text-[var(--color-earth-gold)]">
                  Rp 50.000
                  <span className="block text-xs font-normal text-muted-foreground">sekali bayar</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* User Email Card */}
        {userEmail && (
          <div className="max-w-md mx-auto mb-8 p-4 rounded-xl bg-[var(--color-nature-foliage)]/10 dark:bg-[var(--color-nature-foliage-dark)]/30 border border-[var(--color-nature-foliage)]/30">
            <p className="font-body text-sm text-muted-foreground mb-2">
              Email akun Catetin-mu:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-sm bg-background px-3 py-2 rounded-lg border border-[var(--color-earth-stone)] text-foreground overflow-x-auto">
                {userEmail}
              </code>
              <button
                onClick={copyEmail}
                className="shrink-0 p-2 rounded-lg bg-[var(--color-nature-foliage)] text-white hover:bg-[var(--color-nature-foliage-dark)] transition-colors"
                title="Salin email"
              >
                <Copy size={18} />
              </button>
            </div>
            {copied && (
              <p className="mt-2 text-sm text-[var(--color-nature-foliage)] font-ui">
                Tersalin!
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Gunakan email ini saat checkout di Trakteer.
            </p>
          </div>
        )}

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
                <strong>PENTING:</strong> Masukkan email akun Catetin-mu{userEmail ? ` (${userEmail})` : ''} sebagai "supporter email"
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--color-nature-foliage)] text-white flex items-center justify-center text-sm font-bold">4</span>
              <span>Selesaikan pembayaran — akunmu akan otomatis ter-upgrade dalam beberapa menit!</span>
            </li>
          </ol>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mt-12">
          <h2 className="font-subheadline text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-[var(--color-earth-gold)]" />
            Pertanyaan Umum
          </h2>
          <div className="space-y-4">
            <FAQItem
              question="Bagaimana jika saya menggunakan email berbeda di Trakteer?"
              answer={`Hubungi kami di ${SUPPORT_EMAIL} dengan bukti pembayaran dan email Catetin-mu. Kami akan mengaktifkan premium secara manual.`}
            />
            <FAQItem
              question="Berapa lama hingga akun saya ter-upgrade?"
              answer="Biasanya dalam hitungan menit setelah pembayaran berhasil. Jika lebih dari 1 jam belum ter-upgrade, hubungi kami."
            />
            <FAQItem
              question="Apakah ini pembayaran berlangganan?"
              answer="Tidak. Ini pembayaran sekali saja dan kamu mendapat akses Premium selamanya. Tidak ada biaya bulanan atau tahunan."
            />
            <FAQItem
              question="Bisa minta refund?"
              answer="Karena ini produk digital dengan akses langsung, kami tidak menyediakan refund. Pastikan kamu sudah yakin sebelum membeli."
            />
            <FAQItem
              question="Metode pembayaran apa saja yang tersedia?"
              answer="Trakteer mendukung berbagai metode pembayaran Indonesia: transfer bank, e-wallet (GoPay, OVO, Dana, dll), dan kartu kredit/debit."
            />
          </div>
        </div>

        {/* Support */}
        <div className="text-center mt-12 p-6 rounded-xl bg-[var(--color-earth-stone)]/20 dark:bg-[var(--color-nature-foliage-dark)]/20">
          <p className="font-body text-foreground mb-2">
            Ada masalah atau pertanyaan lain?
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-flex items-center gap-2 font-ui text-[var(--color-nature-foliage)] hover:underline dark:text-[var(--color-nature-sunlight)]"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>
      </main>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-xl border border-[var(--color-earth-stone)] bg-[var(--color-earth-marble)] dark:bg-[var(--color-nature-foliage-dark)]/20 overflow-hidden">
      <summary className="flex items-center justify-between p-4 cursor-pointer font-ui font-semibold text-foreground hover:bg-[var(--color-earth-stone)]/20 transition-colors">
        {question}
        <span className="ml-2 text-muted-foreground group-open:rotate-180 transition-transform">
          ▼
        </span>
      </summary>
      <div className="px-4 pb-4">
        <p className="font-body text-muted-foreground">{answer}</p>
      </div>
    </details>
  )
}
