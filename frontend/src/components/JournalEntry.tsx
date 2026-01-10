import { Send, Loader2 } from 'lucide-react'
import { useRef, useEffect } from 'react'

interface JournalEntryProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isSubmitting: boolean
  placeholder?: string
}

export default function JournalEntry({ 
  value, 
  onChange, 
  onSubmit, 
  isSubmitting,
  placeholder = "Tulis refleksimu di sini..." 
}: JournalEntryProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      <div className="relative group">
        {/* Parchment background effect */}
        <div className="absolute inset-0 bg-parchment rounded-lg transform rotate-1 transition-transform group-hover:rotate-0 duration-500 shadow-md border border-gold/20" />
        
        <div className="relative bg-cream rounded-lg p-1 shadow-inner border border-gold/30">
          <div className="relative bg-transparent min-h-[200px] p-6">
            {/* Lined paper effect */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(transparent_27px,#000_28px)] bg-[length:100%_28px]" />
            
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isSubmitting}
              className="w-full bg-transparent font-body text-lg text-charcoal placeholder-slate/40 resize-none focus:outline-none leading-[28px]"
              rows={6}
              autoFocus
            />

            {/* Submit button area */}
            <div className="flex justify-end mt-4 pt-4 border-t border-gold/10">
              <button
                onClick={onSubmit}
                disabled={!value.trim() || isSubmitting}
                className="group flex items-center gap-2 px-6 py-2 bg-navy text-cream rounded-full font-mono text-sm uppercase tracking-wider hover:bg-charcoal transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:transform active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <span>Simpan</span>
                    <Send className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
