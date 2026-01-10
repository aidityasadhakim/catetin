import { Feather } from 'lucide-react'

interface JournalPromptProps {
  prompt: string
  depthLevel: number
  isLoading?: boolean
}

export default function JournalPrompt({ prompt, depthLevel, isLoading }: JournalPromptProps) {
  // Determine decoration based on depth
  const getDecoration = (level: number) => {
    switch (level) {
      case 1:
        return 'border-gold/30' // Surface
      case 2:
        return 'border-coral/40' // Light
      case 3:
        return 'border-navy/50' // Deep
      default:
        return 'border-gold/30'
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto mb-8 animate-fade-in-up">
      <div 
        className={`relative bg-ivory/80 backdrop-blur-sm p-8 rounded-lg border-2 border-double ${getDecoration(depthLevel)} shadow-md`}
      >
        {/* Decorative corner icon */}
        <div className="absolute -top-3 -left-3 bg-cream p-2 rounded-full border border-gold/20 shadow-sm">
          <Feather className="text-gold w-5 h-5" />
        </div>

        {/* Prompt Text */}
        <div className="text-center">
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gold/10 rounded w-3/4 mx-auto" />
              <div className="h-4 bg-gold/10 rounded w-1/2 mx-auto" />
            </div>
          ) : (
            <h2 className="font-accent italic text-xl md:text-2xl text-charcoal leading-relaxed">
              "{prompt}"
            </h2>
          )}
        </div>

        {/* Bottom decorative line */}
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-6" />
      </div>
    </div>
  )
}
