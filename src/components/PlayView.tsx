import { useState, useMemo } from 'react'
import { Combobox } from '@/components/combobox'
import { EmptyState } from '@/components/empty-state'
import { SearchInput } from '@/components/ui/search-input'
import { ToggleChip } from '@/components/ui/toggle-chip'
import { SpellCard } from '@/components/SpellCard'
import { SpellDetail } from '@/components/SpellDetail'
import { NoSpellsYet } from '@/components/NoSpellsYet'
import { getPactSlotLevel } from '@/lib/spellSlots'
import { spellSaveDC, spellAttackBonus } from '@/lib/stats'
import { levelOptions } from '@/lib/spell-labels'
import type { Spell, KnownSpell, ClassData, Character } from '@/types'

interface PlayViewProps {
  knownSpells: KnownSpell[]
  spellById: Map<string, Spell>
  character: Character
  currentClass: ClassData | undefined
  onTogglePrepared: (spellId: string) => void
  onCast: (slotLevel: number) => void
  onRemove: (spellId: string) => void
  /** Switches to the Manage view, where spells are added. */
  onManage: () => void
}

export function PlayView({
  knownSpells,
  spellById,
  character,
  currentClass,
  onTogglePrepared,
  onCast,
  onRemove,
  onManage,
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

  const levels = useMemo(() => levelOptions(resolved.map(x => x.spell.level)), [resolved])

  const filtered = useMemo(() => {
    return resolved.filter(({ ks, spell }) => {
      if (search && !spell.name.toLowerCase().includes(search.toLowerCase())) return false
      if (levelFilter !== 'all' && String(spell.level) !== levelFilter) return false
      if (preparedOnly && spell.level > 0 && !ks.prepared) return false
      return true
    })
  }, [resolved, search, levelFilter, preparedOnly])

  if (knownSpells.length === 0) {
    return <NoSpellsYet onManage={onManage} />
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 flex-wrap items-center">
        <SearchInput
          label="Search my spells"
          placeholder="Search…"
          value={search}
          onChangeText={setSearch}
          wrapperClassName="w-full sm:w-40 sm:flex-1 min-w-0"
        />
        <Combobox aria-label="Level" className="w-36" options={levels} value={levelFilter} onValueChange={setLevelFilter} />
        <ToggleChip selected={preparedOnly} onClick={() => setPreparedOnly(p => !p)}>
          ★ Prepared only
        </ToggleChip>
      </div>

      <p className="text-xs text-foreground/60" aria-live="polite">{filtered.length} of {resolved.length} spells</p>

      {filtered.length === 0 ? (
        <EmptyState compact title="No spells match your filter." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
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
      )}

      <SpellDetail spell={detailSpell} open={!!detailSpell} onClose={() => setDetailSpell(null)} />
    </div>
  )
}
