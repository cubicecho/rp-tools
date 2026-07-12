import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SpellCard } from '@/components/SpellCard'
import { SpellDetail } from '@/components/SpellDetail'
import { getPactSlotLevel } from '@/lib/spellSlots'
import { spellSaveDC, spellAttackBonus } from '@/lib/stats'
import { LEVEL_LABELS } from '@/lib/utils'
import type { Spell, KnownSpell, ClassData, Character } from '@/types'

interface PlayViewProps {
  knownSpells: KnownSpell[]
  spellById: Map<string, Spell>
  character: Character
  currentClass: ClassData | undefined
  onTogglePrepared: (spellId: string) => void
  onCast: (slotLevel: number) => void
  onRemove: (spellId: string) => void
}

export function PlayView({
  knownSpells,
  spellById,
  character,
  currentClass,
  onTogglePrepared,
  onCast,
  onRemove,
}: PlayViewProps) {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [preparedOnly, setPreparedOnly] = useState(false)
  const [detailSpell, setDetailSpell] = useState<Spell | null>(null)

  const isPact = currentClass?.spellcastingType === 'pact'
  const pactSlotLevel = currentClass ? getPactSlotLevel(currentClass, character.level) : 0
  const dc = currentClass ? spellSaveDC(character.level, character.classId, character.stats) : 0
  const atk = currentClass ? spellAttackBonus(character.level, character.classId, character.stats) : 0

  const resolved = useMemo(() =>
    knownSpells
      .map(ks => ({ ks, spell: spellById.get(ks.spellId) }))
      .filter((x): x is { ks: KnownSpell; spell: Spell } => x.spell !== undefined),
    [knownSpells, spellById]
  )

  const availableLevels = useMemo(() => {
    const levels = new Set(resolved.map(x => x.spell.level))
    return Array.from(levels).sort((a, b) => a - b)
  }, [resolved])

  const filtered = useMemo(() => {
    return resolved.filter(({ ks, spell }) => {
      if (search && !spell.name.toLowerCase().includes(search.toLowerCase())) return false
      if (levelFilter !== 'all' && String(spell.level) !== levelFilter) return false
      if (preparedOnly && spell.level > 0 && !ks.prepared) return false
      return true
    })
  }, [resolved, search, levelFilter, preparedOnly])

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
        <Button
          variant={preparedOnly ? 'default' : 'outline'}
          size="sm"
          className="h-8 text-xs shrink-0"
          onClick={() => setPreparedOnly(p => !p)}
        >
          ★ Prepared only
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} of {resolved.length} spells</p>

      <ScrollArea className="h-[calc(100vh-260px)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 pr-3">
          {filtered.map(({ ks, spell }) => (
            <SpellCard
              key={spell.id}
              spell={spell}
              prepared={ks.prepared}
              variant="detailed"
              currentSlots={character.currentSlots}
              currentPactSlots={character.currentPactSlots}
              pactSlotLevel={pactSlotLevel}
              isPact={isPact}
              spellSaveDC={dc}
              spellAttackBonus={atk}
              characterLevel={character.level}
              onTogglePrepared={() => onTogglePrepared(spell.id)}
              onCast={onCast}
              onRemove={() => onRemove(spell.id)}
              onDetail={() => setDetailSpell(spell)}
            />
          ))}
        </div>
      </ScrollArea>

      <SpellDetail spell={detailSpell} open={!!detailSpell} onClose={() => setDetailSpell(null)} />
    </div>
  )
}
