import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SCHOOL_COLORS, LEVEL_LABELS } from '@/lib/utils'
import type { Spell, KnownSpell } from '@/types'

interface ReferenceViewProps {
  knownSpells: KnownSpell[]
  spellById: Map<string, Spell>
}

export function ReferenceView({ knownSpells, spellById }: ReferenceViewProps) {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')

  const resolved = useMemo(() =>
    knownSpells
      .map(ks => spellById.get(ks.spellId))
      .filter((s): s is Spell => s !== undefined)
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)),
    [knownSpells, spellById]
  )

  const availableLevels = useMemo(() => {
    const levels = new Set(resolved.map(s => s.level))
    return Array.from(levels).sort((a, b) => a - b)
  }, [resolved])

  const filtered = useMemo(() => {
    return resolved.filter(spell => {
      if (search && !spell.name.toLowerCase().includes(search.toLowerCase())) return false
      if (levelFilter !== 'all' && String(spell.level) !== levelFilter) return false
      return true
    })
  }, [resolved, search, levelFilter])

  if (knownSpells.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-center">
        <p className="text-muted-foreground text-sm">No spells in your spell book yet.</p>
        <p className="text-muted-foreground text-xs">Switch to Manage to add spells.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 text-sm w-40 flex-1 min-w-0"
        />
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="h-8 text-xs w-32">
            <SelectValue placeholder="All levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {availableLevels.map(lvl => (
              <SelectItem key={lvl} value={String(lvl)}>{LEVEL_LABELS[lvl]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} of {resolved.length} spells</p>

      <ScrollArea className="h-[calc(100vh-260px)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pr-3">
          {filtered.map(spell => {
            const schoolColor = SCHOOL_COLORS[spell.school] ?? 'bg-gray-100 text-gray-800 border-gray-300'
            return (
              <div key={spell.id} className="rounded-lg border bg-card p-3 flex flex-col gap-2">
                {/* Header */}
                <div className="flex items-start gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm leading-tight">{spell.name}</h3>
                  <div className="flex gap-1.5 flex-wrap ml-auto">
                    <Badge className={`border text-xs ${schoolColor}`}>{spell.school}</Badge>
                    <Badge variant="secondary" className="text-xs">{LEVEL_LABELS[spell.level]}</Badge>
                    {spell.concentration && <Badge variant="outline" className="text-xs">Conc.</Badge>}
                    {spell.ritual && <Badge variant="outline" className="text-xs">Ritual</Badge>}
                  </div>
                </div>

                {/* Meta */}
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <dt className="text-muted-foreground uppercase tracking-wide text-[10px]">Casting Time</dt>
                    <dd>{spell.castingTime}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground uppercase tracking-wide text-[10px]">Range</dt>
                    <dd>{spell.range}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground uppercase tracking-wide text-[10px]">Components</dt>
                    <dd>{spell.components}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground uppercase tracking-wide text-[10px]">Duration</dt>
                    <dd>{spell.duration}</dd>
                  </div>
                </dl>

                {/* Full description */}
                <p className="text-xs leading-relaxed whitespace-pre-line text-foreground/90">{spell.description}</p>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
