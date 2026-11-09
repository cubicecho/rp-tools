import { Moon, Sun } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LEVEL_LABELS } from '@/lib/spell-labels'
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
      <div className="text-sm text-foreground/60">Select a class to track spell slots.</div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-4 items-start">
        {isPact && maxPact ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-foreground/60">Pact ({LEVEL_LABELS[pactLevel]})</span>
            <div className="flex gap-1" role="img" aria-label={`${character.currentPactSlots} of ${maxPact.slots} pact slots left`}>
              {Array.from({ length: maxPact.slots }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-4 w-4 rounded-full border-2 transition-colors',
                    i < character.currentPactSlots
                      ? 'bg-active border-active'
                      : 'border-foreground/30'
                  )}
                />
              ))}
            </div>
          </div>
        ) : (
          slotsToShow.map(({ level, max, current }) => (
            <div key={level} className="flex flex-col gap-1">
              <span className="text-xs text-foreground/60">{LEVEL_LABELS[level]}</span>
              <div className="flex gap-1" role="img" aria-label={`${current} of ${max} ${LEVEL_LABELS[level]}-level slots left`}>
                {Array.from({ length: max }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-4 w-4 rounded-full border-2 transition-colors',
                      i < current
                        ? 'bg-active border-active'
                        : 'border-foreground/30'
                    )}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {slotsToShow.length === 0 && !isPact && (
        <p className="text-xs text-foreground/60">No spell slots at this level.</p>
      )}

      <div className="flex gap-2">
        {currentClass.restType === 'short' && (
          <Button variant="outline" size="xs" iconSlot={<Sun />} content="Short Rest" onClick={onShortRest} />
        )}
        <Button variant="outline" size="xs" iconSlot={<Moon />} content="Long Rest" onClick={onLongRest} />
      </div>
    </div>
  )
}
