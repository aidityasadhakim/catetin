import { Loader2, Send } from 'lucide-react'
import { useEffect, useRef } from 'react'

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
  placeholder = 'Ketuk untuk menulis...',
}: JournalEntryProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="w-full mb-4">
      <div className="flex items-end gap-3">
        {/* Text input area */}
        <div className="flex-1 relative">
          <div className="bg-[var(--color-earth-marble)] rounded-2xl border border-[var(--color-earth-stone)] shadow-sm overflow-hidden">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isSubmitting}
              className="w-full bg-transparent font-body text-base text-foreground placeholder-muted-foreground/60 resize-none focus:outline-none p-4 leading-relaxed min-h-[52px] max-h-[150px]"
              rows={1}
            />
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={onSubmit}
          disabled={!value.trim() || isSubmitting}
          className="flex items-center justify-center w-12 h-12 bg-[var(--color-nature-foliage)] dark:bg-[var(--color-nature-sunlight)] text-white rounded-full font-mono text-sm uppercase tracking-wider hover:bg-[var(--color-nature-foliage-dark)] transition-all disabled:opacity-41 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95"
          aria-label="Kirim"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  )
}
