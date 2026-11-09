import { useState, useMemo } from 'react'
import { CardLayout } from '@/components/card-layout'
import { Combobox } from '@/components/combobox'
import { EmptyState } from '@/components/empty-state'
import { NoSpellsYet } from '@/components/NoSpellsYet'
import { SpellBadges, SpellFacts } from '@/components/SpellFacts'
import { SearchInput } from '@/components/ui/search-input'
import { levelOptions } from '@/lib/spell-labels'
import type { Spell, KnownSpell } from '@/types'

interface ReferenceViewProps {
  knownSpells: KnownSpell[]
  spellById: Map<string, Spell>
  /** Switches to the Manage view, where spells are added. */
  onManage: () => void
}

export function ReferenceView({ knownSpells, spellById, onManage }: ReferenceViewProps) {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')

  const resolved = useMemo(() =>
    knownSpells
      .map(ks => spellById.get(ks.spellId))
      .filter((s): s is Spell => s !== undefined)
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)),
    [knownSpells, spellById]
  )

  const levels = useMemo(() => levelOptions(resolved.map(s => s.level)), [resolved])

  const filtered = useMemo(() => {
    return resolved.filter(spell => {
      if (search && !spell.name.toLowerCase().includes(search.toLowerCase())) return false
      if (levelFilter !== 'all' && String(spell.level) !== levelFilter) return false
      return true
    })
  }, [resolved, search, levelFilter])

  if (knownSpells.length === 0) {
    return <NoSpellsYet onManage={onManage} />
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 flex-wrap">
        <SearchInput
          label="Search my spells"
          placeholder="Search…"
          value={search}
          onChangeText={setSearch}
          wrapperClassName="w-full sm:w-40 sm:flex-1 min-w-0"
        />
        <Combobox aria-label="Level" className="w-36" options={levels} value={levelFilter} onValueChange={setLevelFilter} />
      </div>

      <p className="text-xs text-foreground/60" aria-live="polite">{filtered.length} of {resolved.length} spells</p>

      {filtered.length === 0 ? (
        <EmptyState compact title="No spells match your filter." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map(spell => (
            <CardLayout
              key={spell.id}
              title={spell.name}
              contentSlot={
                <>
                  <SpellBadges spell={spell} />
                  <SpellFacts spell={spell} className="text-xs" />
                  <p className="text-xs leading-relaxed whitespace-pre-line text-foreground/90">{spell.description}</p>
                </>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
