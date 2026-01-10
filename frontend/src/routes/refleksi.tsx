import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Sparkles, PenLine } from 'lucide-react'
import { useStartSession, useAIRespond, useSession } from '../hooks'
import type { Message, SessionRewards } from '../hooks'

export const Route = createFileRoute('/refleksi')({
  component: RefleksiPage,
})

function RefleksiPage() {
  return (
    <>
      <SignedIn>
        <JournalInterface />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

function JournalInterface() {
  const navigate = useNavigate()
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [turnNumber, setTurnNumber] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [rewards, setRewards] = useState<SessionRewards | null>(null)
  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { mutate: startSession, isPending: isStarting } = useStartSession()
  const { mutate: sendToAI, isPending: isSending } = useAIRespond()
  const { data: sessionData, isLoading: isLoadingSession } = useSession(
    activeSessionId ?? undefined
  )

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [localMessages])

  // Sync local messages with session data
  useEffect(() => {
    if (sessionData?.messages) {
      setLocalMessages(sessionData.messages)
    }
  }, [sessionData])

  const handleStartSession = () => {
    startSession(undefined, {
      onSuccess: ({ session, opening_message }) => {
        setActiveSessionId(session.id)
        setTurnNumber(0)
        setIsComplete(false)
        setRewards(null)
        if (opening_message) {
          setLocalMessages([opening_message])
        }
      },
      onError: (error) => {
        console.error('Failed to start session:', error)
      },
    })
  }

  const handleSendMessage = () => {
    if (!inputValue.trim() || !activeSessionId || isSending) return

    const content = inputValue.trim()
    setInputValue('')

    // Optimistically add user message
    const tempUserMessage: Message = {
      id: `temp-user-${Date.now()}`,
      session_id: activeSessionId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    setLocalMessages((prev) => [...prev, tempUserMessage])

    sendToAI(
      { sessionId: activeSessionId, content },
      {
        onSuccess: (response) => {
          // Replace temp message with real messages
          setLocalMessages((prev) => {
            const filtered = prev.filter(
              (m) => !m.id.startsWith('temp-user-')
            )
            return [...filtered, response.user_message, response.message]
          })
          setTurnNumber(response.turn_number)
          setIsComplete(response.is_complete)
          if (response.rewards) {
            setRewards(response.rewards)
          }
        },
        onError: (error) => {
          console.error('Failed to send message:', error)
          // Remove optimistic message on error
          setLocalMessages((prev) =>
            prev.filter((m) => !m.id.startsWith('temp-'))
          )
          setInputValue(content) // Restore input
        },
      }
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Welcome screen - no active session
  if (!activeSessionId) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
        <div className="max-w-md text-center">
          {/* Decorative element */}
          <div className="mb-8 text-gold">
            <PenLine size={64} className="mx-auto" />
          </div>

          <h1 className="font-heading text-4xl text-charcoal mb-4">
            Refleksi
          </h1>
          <p className="font-body text-slate mb-8 leading-relaxed">
            Mulai percakapan dengan Sang Pujangga. Tiga giliran untuk
            merefleksikan apa yang ada di pikiranmu hari ini.
          </p>

          <button
            onClick={handleStartSession}
            disabled={isStarting}
            className="inline-flex items-center gap-3 bg-navy text-cream font-mono uppercase tracking-widest px-8 py-4 rounded-lg hover:bg-charcoal transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStarting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Memulai...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                <span>Mulai Menulis</span>
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // Session complete - show rewards
  if (isComplete && rewards) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
        <div className="max-w-lg text-center animate-fade-in">
          {/* Golden celebration */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-gold/20 rounded-full blur-3xl animate-pulse" />
            <Sparkles
              size={80}
              className="mx-auto text-gold relative z-10"
            />
          </div>

          <h1 className="font-heading text-4xl text-charcoal mb-4">
            Persembahan Diterima
          </h1>
          <p className="font-body text-slate mb-8">
            Refleksimu hari ini telah menjadi bagian dari perjalananmu.
          </p>

          {/* Rewards display */}
          <div className="bg-ivory border border-gold/30 rounded-xl p-6 mb-8">
            <h2 className="font-mono text-xs uppercase tracking-widest text-slate mb-4">
              Hadiah Hari Ini
            </h2>
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="font-heading text-3xl text-gold mb-1">
                  +{rewards.tinta_emas}
                </div>
                <div className="font-mono text-xs uppercase tracking-widest text-slate">
                  Tinta Emas
                </div>
              </div>
              <div className="text-center">
                <div className="font-heading text-3xl text-charcoal mb-1">
                  +{rewards.marmer}
                </div>
                <div className="font-mono text-xs uppercase tracking-widest text-slate">
                  Marmer
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gold/20">
              <div className="font-mono text-sm text-olive">
                Streak: {rewards.new_streak} hari
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setActiveSessionId(null)
                setLocalMessages([])
                setTurnNumber(0)
                setIsComplete(false)
                setRewards(null)
              }}
              className="inline-flex items-center gap-2 bg-navy text-cream font-mono uppercase tracking-widest px-6 py-3 rounded-lg hover:bg-charcoal transition-all"
            >
              <PenLine size={18} />
              <span>Tulis Lagi</span>
            </button>
            <button
              onClick={() => navigate({ to: '/' })}
              className="inline-flex items-center gap-2 bg-transparent text-charcoal border border-charcoal font-mono uppercase tracking-widest px-6 py-3 rounded-lg hover:bg-parchment transition-all"
            >
              <span>Kembali</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Active chat session
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header with turn indicator */}
      <div className="sticky top-0 z-10 bg-cream border-b border-gold/20 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="font-heading text-xl text-charcoal">Refleksi</h1>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-slate">
              Giliran
            </span>
            <div className="flex gap-1">
              {[1, 2, 3].map((turn) => (
                <div
                  key={turn}
                  className={`w-8 h-2 rounded-full transition-all ${
                    turn <= turnNumber
                      ? 'bg-gold'
                      : 'bg-parchment border border-gold/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {isLoadingSession && localMessages.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-gold" size={32} />
            </div>
          ) : (
            localMessages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}

          {/* Typing indicator */}
          {isSending && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
                <PenLine size={14} className="text-cream" />
              </div>
              <div className="bg-ivory border border-gold/20 rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gold rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-gold rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  />
                  <div
                    className="w-2 h-2 bg-gold rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="sticky bottom-0 bg-cream border-t border-gold/20 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end gap-3 bg-ivory border border-gold/30 rounded-xl p-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ceritakan apa yang ada di pikiranmu..."
              disabled={isSending || isComplete}
              rows={1}
              className="flex-1 resize-none bg-transparent font-body text-charcoal placeholder-slate/50 px-3 py-2 focus:outline-none disabled:opacity-50"
              style={{
                minHeight: '44px',
                maxHeight: '120px',
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isSending || isComplete}
              className="p-3 bg-navy text-cream rounded-lg hover:bg-charcoal transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
          <p className="font-mono text-xs text-slate/60 mt-2 text-center">
            Tekan Enter untuk mengirim, Shift+Enter untuk baris baru
          </p>
        </div>
      </div>
    </div>
  )
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-gold' : 'bg-navy'
        }`}
      >
        {isUser ? (
          <span className="font-mono text-xs text-navy font-bold">A</span>
        ) : (
          <PenLine size={14} className="text-cream" />
        )}
      </div>

      {/* Message bubble */}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-gold text-navy rounded-tr-none'
            : 'bg-ivory border border-gold/20 text-charcoal rounded-tl-none'
        }`}
      >
        <p className="font-body leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    </div>
  )
}
