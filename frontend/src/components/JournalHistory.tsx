import type { Message } from '../hooks'

interface JournalHistoryProps {
  messages: Array<Message>
}

export default function JournalHistory({ messages }: JournalHistoryProps) {
  // We only show pairs of (Prompt + Response)
  // Filter messages to group them

  if (messages.length === 0) return null

  return (
    <div className="w-full max-w-3xl mx-auto mt-16 pb-24 border-t border-gold/20 pt-8">
      <h3 className="font-heading text-lg text-slate mb-8 text-center tracking-widest uppercase opacity-70">
        Riwayat Sesi Ini
      </h3>

      <div className="space-y-12">
        {messages.map((msg) => {
          // AI Message (Prompt)
          if (msg.role !== 'user') {
            return (
              <div key={msg.id} className="text-center px-8 opacity-70">
                <p className="font-accent italic text-slate text-lg">
                  "{msg.content}"
                </p>
                <div className="w-8 h-px bg-gold/30 mx-auto mt-4" />
              </div>
            )
          }

          // User Message (Entry)
          return (
            <div key={msg.id} className="relative px-8 md:px-12">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold/20 rounded-full" />
              <p className="font-body text-charcoal leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
              <div className="mt-2 text-right">
                <span className="font-mono text-xs text-slate/50">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
