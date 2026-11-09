import { DialogLayout } from '@/components/dialog-layout'
import { SpellBadges, SpellFacts } from '@/components/SpellFacts'
import type { Spell } from '@/types'

interface SpellDetailProps {
  spell: Spell | null
  open: boolean
  onClose: () => void
}

export function SpellDetail({ spell, open, onClose }: SpellDetailProps) {
  if (!spell) return null

  return (
    <DialogLayout
      open={open}
      onOpenChange={o => { if (!o) onClose() }}
      title={spell.name}
      size="lg"
      contentSlot={
        <>
          <SpellBadges spell={spell} />
          <SpellFacts spell={spell} />
          <p className="text-sm leading-relaxed whitespace-pre-line">{spell.description}</p>
          <p className="text-xs text-foreground/60">
            Classes: {spell.classes.join(', ')} · {spell.source}
          </p>
        </>
      }
    />
  )
}
