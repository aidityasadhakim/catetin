import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground font-body selection:bg-earth-gold selection:text-nature-foliage-dark">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/assets/images/landing-page-background.png')",
        }}
      >
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
      </div>

      {/* Dither/Grain Overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 md:px-12">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gradient-to-br from-earth-gold to-white opacity-80 backdrop-blur-md"></div>
          <span className="font-ui text-2xl font-bold tracking-widest text-white drop-shadow-md">
            CATETIN
          </span>
        </div>

        <div className="hidden items-center gap-12 md:flex">
          <div className="flex gap-8 font-ui text-sm font-medium tracking-wide text-white/90 drop-shadow-sm">
            <Link
              to="/refleksi"
              className="transition-colors hover:text-earth-gold"
            >
              Masuk
            </Link>
          </div>
          <Link
            to="/refleksi"
            className="rounded-full border border-white/20 bg-earth-gold  px-6 py-2 font-ui text-sm text-black backdrop-blur-md transition-all hover:scale-105 hover:bg-white/20 active:scale-95"
          >
            Mulai Menulis
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex min-h-[80vh] flex-col justify-center px-8 md:px-12">
        <div className="max-w-4xl">
          {/* Hero Headline */}
          <h1 className="animate-fade-in-up font-headline font-bold text-6xl leading-[0.9] tracking-tight text-white drop-shadow-lg md:text-8xl lg:text-[7rem]">
            Tulis masalahnya <br />
            <span className="ml-12 md:ml-24">Klaim reward-nya.</span>
          </h1>

          {/* Subtext */}
          <div className="mt-8 max-w-lg animate-fade-in-up space-y-4 font-body text-xl font-semibold text-white/90 drop-shadow-md [animation-delay:200ms]">
            <p>
              Hidup adalah game, dan jurnal ini adalah save point-mu. <br />
              Selesaikan misi harian dengan mencatat, dan bangun pilar ketenanganmu.</p>
          </div>

          {/* CTA Buttons */}
          <div className="mt-10 flex animate-fade-in-up items-center gap-6 [animation-delay:400ms]">
            <Link
              to="/refleksi"
              className="rounded-full bg-earth-gold px-8 py-3 font-ui font-semibold text-nature-foliage-dark shadow-[0_0_20px_rgba(212,168,75,0.4)] transition-transform hover:scale-105 hover:bg-white hover:text-nature-foliage-dark"
            >
              Mulai Sekarang
            </Link>
            <button className="font-ui text-white transition-colors hover:text-earth-gold">
              Pelajari Lebih Lanjut
            </button>
          </div>
        </div>

        {/* Floating Collection Card (Bottom Right) */}
        <div className="absolute bottom-12 right-8 w-64 animate-float md:bottom-24 md:right-16">
          <div className="group relative overflow-hidden border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl transition-all hover:bg-white/20">
            <div className="absolute right-0 top-0 p-2 opacity-50">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-white"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="mb-2 font-headline text-3xl text-earth-gold drop-shadow-sm">
              Mahakarya <br /> Minggu Ini
            </h3>

            <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-4">
              <span className="font-ui text-xs text-white/80">
                Lihat Koleksi
              </span>
              <span className="text-white">→</span>
            </div>

            {/* Decorative Image inside card */}
            <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-earth-gold/20 blur-2xl transition-all group-hover:bg-earth-gold/30"></div>
          </div>
        </div>

        {/* Bottom Scroll/Collection Indicators */}
        <div className="absolute bottom-8 left-8 flex animate-fade-in-up items-center gap-2 font-mono text-xs text-white/60 [animation-delay:600ms]">
          <span className="animate-bounce">↓</span> Gulir
        </div>

        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 animate-fade-in-up items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-1.5 backdrop-blur-md [animation-delay:600ms]">
          <div
            className="h-4 w-6 rounded-sm bg-cover bg-center"
            style={{
              backgroundImage:
                "url('/assets/images/landing-page-background.png')",
            }}
          ></div>
          <span className="font-mono text-xs text-white">Koleksi</span>
          <span className="ml-1 text-white/40">≡</span>
        </div>
      </main>

      {/* Decorative Corner Lines (Grid lines) */}
      <div className="pointer-events-none absolute inset-0 z-20">
        <div className="absolute left-0 top-24 h-[1px] w-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div className="absolute left-8 top-0 h-full w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent md:left-12"></div>
        <div className="absolute right-8 top-0 h-full w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent md:right-12"></div>

        {/* Crosses */}
        <div className="absolute left-8 top-24 h-3 w-3 -translate-x-1/2 -translate-y-1/2 text-earth-gold md:left-12">
          ✦
        </div>
        <div className="absolute right-8 top-24 h-3 w-3 -translate-y-1/2 translate-x-1/2 text-earth-gold md:right-12">
          ✦
        </div>
      </div>
    </div>
  )
}
