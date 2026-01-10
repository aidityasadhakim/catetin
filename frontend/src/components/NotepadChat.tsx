import { useEffect, useRef } from 'react'
import type { Message } from '../hooks'

interface NotepadChatProps {
  messages: Array<Message>
  isLoading: boolean
  className?: string
}

export default function NotepadChat({
  messages,
  isLoading,
  className = '',
}: NotepadChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className={`relative flex flex-col ${className}`}>
      {/* Notepad container */}
      <div className="relative flex-1 flex flex-col rounded-2xl shadow-lg overflow-hidden border border-[var(--color-earth-stone)]">
        {/* Main paper background */}
        <div className="absolute inset-0 bg-[var(--color-earth-marble)]" />

        {/* Lined paper effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.14] bg-[linear-gradient(transparent_27px,var(--color-nature-foliage)_28px)] bg-[length:100%_28px] z-10" />

        {/* Paper grain/noise texture overlay (SVG) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.15] mix-blend-overlay z-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Scrollable content area */}
        <div
          ref={scrollRef}
          className="relative z-20 flex-1 overflow-y-auto p-6 pb-8"
        >
          {/* Date header inside notepad */}
          <header className="mb-6">
            <time className="font-mono text-xs text-muted-foreground tracking-wide">
              {today}
            </time>
          </header>

          {/* Messages flow */}
          <div className="space-y-6">
            {messages.map((message) => (
              <MessageBlock key={message.id} message={message} />
            ))}

            {/* Loading indicator */}
            {isLoading && <LoadingIndicator />}
          </div>

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>

        {/* Subtle bottom fade for scroll indication */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--color-earth-marble)] to-transparent pointer-events-none z-30" />
      </div>
    </div>
  )
}

interface MessageBlockProps {
  message: Message
}

function MessageBlock({ message }: MessageBlockProps) {
  const isAI = message.role === 'assistant'

  return (
    <div
      className={`font-body text-lg leading-[28px] ${isAI
        ? 'italic text-md text-[var(--color-nature-foliage-dark)] dark:text-[var(--color-nature-sunlight)]'
        : 'text-foreground'
        }`}
    >
      {message.content}
    </div>
  )
}

function LoadingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      <span
        className="w-2 h-2 rounded-full bg-[var(--color-nature-foliage)] animate-bounce"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="w-2 h-2 rounded-full bg-[var(--color-nature-foliage)] animate-bounce"
        style={{ animationDelay: '150ms' }}
      />
      <span
        className="w-2 h-2 rounded-full bg-[var(--color-nature-foliage)] animate-bounce"
        style={{ animationDelay: '300ms' }}
      />
    </div>
  )
}
