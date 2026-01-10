import { createFileRoute } from '@tanstack/react-router'
import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { Loader2, Sparkles, Star, Trophy } from 'lucide-react'
import { useAIRespond, useTodaySession } from '../hooks'

import NotepadChat from '../components/NotepadChat'
import JournalEntry from '../components/JournalEntry'
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
  const [inputValue, setInputValue] = useState('')
  const [localMessages, setLocalMessages] = useState<Array<Message>>([])
  const [lastReward, setLastReward] = useState<SessionRewards | null>(null)
  const [showRewardToast, setShowRewardToast] = useState(false)

  // Get or create today's session
  const {
    data: todaySession,
    isLoading: isLoadingSession,
    error,
  } = useTodaySession()
  const { mutate: sendToAI, isPending: isSending } = useAIRespond()

  const sessionId = todaySession?.session.id

  // Sync local messages with session data
  useEffect(() => {
    if (todaySession?.messages) {
      setLocalMessages(todaySession.messages)
    }
  }, [todaySession])

  // Hide reward toast after 3 seconds
  useEffect(() => {
    if (showRewardToast) {
      const timer = setTimeout(() => setShowRewardToast(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showRewardToast])

  const handleSendMessage = () => {
    if (!inputValue.trim() || !sessionId || isSending) return

    const content = inputValue.trim()
    setInputValue('')

    // Optimistically add user message
    const tempUserMessage: Message = {
      id: `temp-user-${Date.now()}`,
      session_id: sessionId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }

    // Update local messages immediately
    setLocalMessages((prev) => [...prev, tempUserMessage])

    sendToAI(
      { sessionId, content },
      {
        onSuccess: (response) => {
          // Replace temp message with real messages
          setLocalMessages((prev) => {
            const filtered = prev.filter((m) => !m.id.startsWith('temp-user-'))
            // Add user message (confirmed) and new AI prompt
            return [...filtered, response.user_message, response.message]
          })

          // Show reward toast if rewards were given (any XP or Tinta Emas)
          if (response.rewards && (response.rewards.tinta_emas > 0 || response.rewards.xp_earned > 0)) {
            setLastReward(response.rewards)
            setShowRewardToast(true)
          }
        },
        onError: (sendError) => {
          console.error('Failed to send message:', sendError)
          // Remove optimistic message on error
          setLocalMessages((prev) =>
            prev.filter((m) => !m.id.startsWith('temp-')),
          )
          setInputValue(content) // Restore input
        },
      },
    )
  }

  // Determine if we're waiting for AI response
  const isWaitingForAI =
    isSending ||
    (localMessages.length > 0 &&
      localMessages[localMessages.length - 1].role === 'user')

  // Loading state
  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2
          className="animate-spin text-[var(--color-earth-gold)] mb-4"
          size={48}
        />
        <p className="font-body text-muted-foreground">
          Mempersiapkan ruang refleksi...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="font-body text-destructive mb-4">
          Terjadi kesalahan saat memuat sesi.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[var(--color-nature-foliage)] text-white font-ui px-6 py-3 rounded-full"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-[var(--color-earth-gold)]/30">
      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 pb-6 max-w-2xl mx-auto w-full">
        {/* Notepad Chat Area */}
        <NotepadChat
          messages={localMessages}
          isLoading={isWaitingForAI}
          className="flex-1 min-h-0 mb-4"
        />

        {/* Input Area with Reward Toast */}
        <div className="shrink-0 relative">
          {/* Reward Toast - positioned above input */}
          {showRewardToast && lastReward && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 animate-[fadeInUp_0.4s_ease-out_forwards]">
              {lastReward.leveled_up ? (
                // Level-up celebration toast
                <div className="bg-gradient-to-r from-[var(--color-earth-gold)] to-[var(--color-nature-sunlight)] text-[var(--color-nature-foliage-dark)] px-6 py-4 rounded-2xl shadow-lg border-2 border-[var(--color-earth-gold)] animate-pulse">
                  <div className="flex items-center gap-3 justify-center mb-2">
                    <Trophy className="text-[var(--color-nature-foliage-dark)]" size={24} />
                    <span className="font-subheadline text-lg font-bold">
                      Level {lastReward.level}!
                    </span>
                    <Trophy className="text-[var(--color-nature-foliage-dark)]" size={24} />
                  </div>
                  <div className="flex items-center gap-4 justify-center text-sm font-mono">
                    <span className="flex items-center gap-1">
                      <Sparkles size={14} />
                      +{lastReward.tinta_emas} Tinta Emas
                    </span>
                    <span className="opacity-60">•</span>
                    <span className="flex items-center gap-1">
                      <Star size={14} />
                      +{lastReward.xp_earned} XP
                    </span>
                  </div>
                </div>
              ) : (
                // Regular reward toast
                <div className="bg-[var(--color-nature-foliage-dark)]/95 dark:bg-[var(--color-nature-sunlight)]/95 backdrop-blur-sm text-white dark:text-[var(--color-nature-foliage-dark)] px-5 py-3 rounded-full shadow-lg flex items-center gap-3 border border-[var(--color-earth-gold)]/50">
                  <Sparkles className="text-[var(--color-earth-gold)]" size={18} />
                  <span className="font-mono text-sm">
                    +{lastReward.tinta_emas} Tinta Emas
                  </span>
                  <span className="text-white/40 dark:text-[var(--color-nature-foliage-dark)]/40">•</span>
                  <span className="font-mono text-sm flex items-center gap-1">
                    <Star className="text-[var(--color-nature-sunlight)] dark:text-[var(--color-nature-foliage-dark)]" size={14} />
                    +{lastReward.xp_earned} XP
                  </span>
                </div>
              )}
            </div>
          )}

          <JournalEntry
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSendMessage}
            isSubmitting={isSending}
          />
        </div>
      </main>
    </div>
  )
}
