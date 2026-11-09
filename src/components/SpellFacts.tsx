import { Badge } from '@/components/ui/badge'
import { LEVEL_LABELS, SCHOOL_COLORS } from '@/lib/spell-labels'
import { cn } from '@/lib/utils'
import type { Spell } from '@/types'

const FALLBACK_SCHOOL_COLOR = 'bg-gray-100 text-gray-800 border-gray-300'

/** The school's chip colours, for a badge that names the spell's level or school. */
export function schoolColor(spell: Spell): string {
  return SCHOOL_COLORS[spell.school] ?? FALLBACK_SCHOOL_COLOR
}

/** The level, the school, and concentration and ritual when they apply. */
export function SpellBadges({ spell, className }: { spell: Spell; className?: string }) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      <Badge className={cn('border', schoolColor(spell))}>{LEVEL_LABELS[spell.level]}</Badge>
      <Badge variant="outline">{spell.school}</Badge>
      {spell.concentration && <Badge variant="secondary">Concentration</Badge>}
      {spell.ritual && <Badge variant="secondary">Ritual</Badge>}
    </div>
  )
}

/** Casting time, range, duration and components, as label and value pairs. */
export function SpellFacts({ spell, className }: { spell: Spell; className?: string }) {
  const facts: [string, string][] = [
    ['Casting Time', spell.castingTime],
    ['Range', spell.range],
    ['Duration', spell.duration],
    ['Components', spell.components],
  ]
  return (
    <dl className={cn('grid grid-cols-2 gap-x-4 gap-y-2 text-sm', className)}>
      {facts.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs uppercase tracking-wide text-foreground/60">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
