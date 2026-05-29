import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LEVEL_LABELS, cn } from '@/lib/utils'
import { getPactSlotLevel } from '@/lib/spellSlots'
import type { Character, ClassData } from '@/types'

interface SpellSlotTrackerProps {
  character: Character
  currentClass: ClassData | undefined
  onShortRest: () => void
  onLongRest: () => void
}

export function SpellSlotTracker({ character, currentClass, onShortRest, onLongRest }: SpellSlotTrackerProps) {
  const isPact = currentClass?.spellcastingType === 'pact'
  const maxSlots = currentClass?.spellSlots[character.level - 1] ?? []
  const maxPact = currentClass?.pactSlots?.[character.level - 1]
  const pactLevel = currentClass ? getPactSlotLevel(currentClass, character.level) : 0

  const slotsToShow = isPact
    ? []
    : maxSlots
        .map((max, idx) => ({ level: idx + 1, max, current: character.currentSlots[idx] ?? 0 }))
        .filter(s => s.max > 0)

  if (!currentClass) {
    return (
      <div className="text-sm text-muted-foreground">Select a class to track spell slots.</div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-4 items-start">
        {isPact && maxPact ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Pact ({LEVEL_LABELS[pactLevel]})</span>
            <div className="flex gap-1">
              {Array.from({ length: maxPact.slots }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-4 w-4 rounded-full border-2 transition-colors',
                    i < character.currentPactSlots
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground/40'
                  )}
                />
              ))}
            </div>
          </div>
        ) : (
          slotsToShow.map(({ level, max, current }) => (
            <div key={level} className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{LEVEL_LABELS[level]}</span>
              <div className="flex gap-1">
                {Array.from({ length: max }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-4 w-4 rounded-full border-2 transition-colors',
                      i < current
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground/40'
                    )}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {slotsToShow.length === 0 && !isPact && (
        <p className="text-xs text-muted-foreground">No spell slots at this level.</p>
      )}

      <div className="flex gap-2">
        {currentClass.restType === 'short' && (
          <Button variant="outline" size="sm" onClick={onShortRest} className="h-7 text-xs gap-1.5">
            <Sun className="h-3 w-3" /> Short Rest
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onLongRest} className="h-7 text-xs gap-1.5">
          <Moon className="h-3 w-3" /> Long Rest
        </Button>
      </div>
    </div>
  )
}
