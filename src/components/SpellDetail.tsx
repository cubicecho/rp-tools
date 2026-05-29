import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SCHOOL_COLORS, LEVEL_LABELS } from '@/lib/utils'
import type { Spell } from '@/types'

interface SpellDetailProps {
  spell: Spell | null
  open: boolean
  onClose: () => void
}

export function SpellDetail({ spell, open, onClose }: SpellDetailProps) {
  if (!spell) return null

  const schoolColor = SCHOOL_COLORS[spell.school] ?? 'bg-gray-100 text-gray-800 border-gray-300'

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start gap-2 flex-wrap pr-6">
            <DialogTitle className="text-lg">{spell.name}</DialogTitle>
            <div className="flex gap-1.5 flex-wrap">
              <Badge className={`border ${schoolColor}`}>{spell.school}</Badge>
              <Badge variant="secondary">{LEVEL_LABELS[spell.level]}</Badge>
              {spell.concentration && <Badge variant="outline">Concentration</Badge>}
              {spell.ritual && <Badge variant="outline">Ritual</Badge>}
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs uppercase tracking-wide">Casting Time</dt>
            <dd>{spell.castingTime}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs uppercase tracking-wide">Range</dt>
            <dd>{spell.range}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs uppercase tracking-wide">Components</dt>
            <dd>{spell.components}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs uppercase tracking-wide">Duration</dt>
            <dd>{spell.duration}</dd>
          </div>
        </dl>

        <Separator />

        <div className="text-sm leading-relaxed whitespace-pre-line">{spell.description}</div>

        <div className="text-xs text-muted-foreground">
          Classes: {spell.classes.join(', ')} · {spell.source}
        </div>
      </DialogContent>
    </Dialog>
  )
}
