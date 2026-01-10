import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { Home, Sparkles, Loader2 } from 'lucide-react'
import { useAIRespond, useTodaySession } from '../hooks'
import type { Message, SessionRewards } from '../hooks'
import { DepthLevelNames } from '../lib/api'

// New Components
import JournalPrompt from '../components/JournalPrompt'
import JournalEntry from '../components/JournalEntry'
import JournalHistory from '../components/JournalHistory'

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
  const [inputValue, setInputValue] = useState('')
  const [depthLevel, setDepthLevel] = useState(1)
  const [localMessages, setLocalMessages] = useState<Array<Message>>([])
  const [lastReward, setLastReward] = useState<SessionRewards | null>(null)
  const [showRewardToast, setShowRewardToast] = useState(false)

  // Get or create today's session
  const { data: todaySession, isLoading: isLoadingSession, error } = useTodaySession()
  const { mutate: sendToAI, isPending: isSending } = useAIRespond()

  const sessionId = todaySession?.session?.id

  // Sync local messages with session data
  useEffect(() => {
    if (todaySession?.messages) {
      setLocalMessages(todaySession.messages)
      setDepthLevel(todaySession.depth_level || 1)
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

    // Scroll to bottom (optional, or just let natural flow handle it)
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })

    sendToAI(
      { sessionId, content },
      {
        onSuccess: (response) => {
          // Replace temp message with real messages
          setLocalMessages((prev) => {
            const filtered = prev.filter(
              (m) => !m.id.startsWith('temp-user-')
            )
            // Add user message (confirmed) and new AI prompt
            return [...filtered, response.user_message, response.message]
          })
          setDepthLevel(response.depth_level)
          
          // Show reward toast if rewards were given
          if (response.rewards && response.rewards.tinta_emas > 0) {
            setLastReward(response.rewards)
            setShowRewardToast(true)
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

  // Determine what to show
  // 1. History: All messages EXCEPT the last AI message (which is the active prompt)
  // 2. Active Prompt: The last AI message
  
  let historyMessages: Message[] = []
  let activePrompt = "..."

  if (localMessages.length > 0) {
    const lastMsg = localMessages[localMessages.length - 1]
    if (lastMsg.role !== 'user') {
      // Last message is AI -> It's the active prompt
      activePrompt = lastMsg.content
      historyMessages = localMessages.slice(0, -1)
    } else {
      // Last message is User -> We are waiting for AI
      // Show everything in history? Or show loading?
      // Since we optimistic update, the user message IS the last message.
      // So we are "waiting for prompt".
      // We should probably keep the OLD prompt visible or show loading.
      // But typically in a journal flow:
      // Prompt 1 -> Answer 1 -> Prompt 2 (Loading)
      
      // Let's just show history up to the user message
      historyMessages = localMessages
      // Active prompt is loading
      activePrompt = "..." 
    }
  }

  // Loading state
  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
        <Loader2 className="animate-spin text-gold mb-4" size={48} />
        <p className="font-body text-slate">Mempersiapkan ruang refleksi...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
        <p className="font-body text-coral mb-4">Terjadi kesalahan saat memuat sesi.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-navy text-cream font-mono uppercase px-6 py-3 rounded-lg"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream relative selection:bg-gold/30">
      {/* Background Texture */}
      <div className="fixed inset-0 pointer-events-none opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] z-0" />

      {/* Reward Toast */}
      {showRewardToast && lastReward && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="bg-navy/95 backdrop-blur-sm text-cream px-6 py-3 rounded-full shadow-lg flex items-center gap-3 border border-gold/50">
            <Sparkles className="text-gold" size={20} />
            <span className="font-mono text-sm">
              +{lastReward.tinta_emas} Tinta Emas
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur-md border-b border-gold/10 px-4 py-4 transition-all">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate({ to: '/' })}
            className="p-2 text-slate hover:text-charcoal transition-colors rounded-full hover:bg-gold/10"
            aria-label="Kembali"
          >
            <Home size={20} />
          </button>

          <div className="flex flex-col items-center">
             <h1 className="font-heading text-xl text-charcoal tracking-[0.2em] text-center">
              REFLEKSI
            </h1>
            <span className="text-[10px] font-mono text-gold uppercase tracking-widest mt-1">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>

          <div className="flex items-center gap-2" title={`Kedalaman: ${DepthLevelNames[depthLevel]}`}>
            {[1, 2, 3].map((level) => (
              <div
                key={level}
                className={`w-2 h-2 rounded-full transition-all duration-500 ${
                  level <= depthLevel ? 'bg-gold scale-110' : 'bg-slate/20'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-12 flex flex-col min-h-[calc(100vh-80px)]">
        
        {/* 1. Active Prompt Area */}
        <section className="mb-8">
            <JournalPrompt 
                prompt={activePrompt} 
                depthLevel={depthLevel} 
                isLoading={isSending || (localMessages.length > 0 && localMessages[localMessages.length-1].role === 'user')} 
            />
        </section>

        {/* 2. Writing Area */}
        <section className="mb-16">
            <JournalEntry 
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handleSendMessage}
                isSubmitting={isSending}
            />
        </section>

        {/* 3. History Area */}
        <section>
            <JournalHistory messages={historyMessages} />
        </section>

      </main>
    </div>
  )
}
