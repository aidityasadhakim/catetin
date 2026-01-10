/**
 * Static decorative background for the chat/refleksi page
 * Sky gradient from cream to soft blue with Renaissance-style decorations
 */
export default function ChatBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, #F5F0E8 0%, #E8F4F8 50%, #D4E5ED 100%)',
        }}
      />

      {/* Decorative angel - top right */}
      <img
        src="/assets/images/single-baby-angel.png"
        alt=""
        aria-hidden="true"
        className="absolute top-16 right-8 w-24 h-auto opacity-30 animate-float-gentle"
        style={{ animationDelay: '0s' }}
      />

      {/* Decorative angel - top left */}
      <img
        src="/assets/images/three-baby-angel.png"
        alt=""
        aria-hidden="true"
        className="absolute top-32 left-4 w-32 h-auto opacity-20 animate-float-gentle"
        style={{ animationDelay: '2s' }}
      />

      {/* Decorative branches - bottom left */}
      <img
        src="/assets/images/single-bush.png"
        alt=""
        aria-hidden="true"
        className="absolute bottom-0 left-0 w-48 h-auto opacity-20"
      />

      {/* Subtle clouds using CSS */}
      <div
        className="absolute top-1/4 left-1/3 w-64 h-24 rounded-full opacity-10"
        style={{
          background:
            'radial-gradient(ellipse, white 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-1/3 right-1/4 w-48 h-16 rounded-full opacity-10"
        style={{
          background:
            'radial-gradient(ellipse, white 0%, transparent 70%)',
        }}
      />

      {/* Subtle vignette overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(245,240,232,0.5) 100%)',
        }}
      />
    </div>
  )
}
