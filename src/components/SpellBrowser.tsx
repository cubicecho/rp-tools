import { useState, useMemo } from 'react'
import { Combobox } from '@/components/combobox'
import { EmptyState } from '@/components/empty-state'
import { List } from '@/components/list'
import { ListItem } from '@/components/list-item'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, Plus } from '@/components/ui/icons'
import { SearchInput } from '@/components/ui/search-input'
import { SpellDetail } from '@/components/SpellDetail'
import { schoolColor } from '@/components/SpellFacts'
import { LEVEL_LABELS, SCHOOLS, levelOptions } from '@/lib/spell-labels'
import { cn } from '@/lib/utils'
import type { Spell } from '@/types'

const SCHOOL_OPTIONS = [
  { value: 'all', label: 'All schools' },
  ...SCHOOLS.map(s => ({ value: s, label: s })),
]

interface SpellBrowserProps {
  spells: Spell[]
  knownIds: Set<string>
  classId: string
  onAdd: (spellId: string) => void
}

export function SpellBrowser({ spells, knownIds, classId, onAdd }: SpellBrowserProps) {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [schoolFilter, setSchoolFilter] = useState('all')
  const [detailSpell, setDetailSpell] = useState<Spell | null>(null)

  const classSpells = useMemo(() =>
    classId
      ? spells.filter(s => s.classes.some(c => c.toLowerCase() === classId.toLowerCase()))
      : spells,
    [spells, classId]
  )

  const filtered = useMemo(() => {
    return classSpells.filter(s => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false
      if (levelFilter !== 'all' && String(s.level) !== levelFilter) return false
      if (schoolFilter !== 'all' && s.school !== schoolFilter) return false
      return true
    })
  }, [classSpells, search, levelFilter, schoolFilter])

  const levels = useMemo(() => levelOptions(classSpells.map(s => s.level)), [classSpells])

  return (
    <div className="flex flex-col gap-3">
      <SearchInput label="Search spells" placeholder="Search spells…" value={search} onChangeText={setSearch} />

      <div className="flex gap-2">
        <Combobox aria-label="Level" className="flex-1" options={levels} value={levelFilter} onValueChange={setLevelFilter} />
        <Combobox aria-label="School" className="flex-1" options={SCHOOL_OPTIONS} value={schoolFilter} onValueChange={setSchoolFilter} />
      </div>

      <p className="text-xs text-foreground/60" aria-live="polite">{filtered.length} spells</p>

      {filtered.length === 0 ? (
        <EmptyState compact title="No spells match these filters." />
      ) : (
        <List
          label="Class spells"
          contentSlot={filtered.map(spell => {
            const known = knownIds.has(spell.id)
            return (
              <ListItem
                key={spell.id}
                leadingSlot={
                  <Badge className={cn('border shrink-0', schoolColor(spell))}>{LEVEL_LABELS[spell.level]}</Badge>
                }
                title={spell.name}
                meta={spell.school}
                onClick={() => setDetailSpell(spell)}
                actionSlot={
                  known ? (
                    <Button
                      variant="outline"
                      size="icon-xs"
                      aria-label={`${spell.name} is in your spell book`}
                      hint="Already in your spell book"
                      disabled
                      iconSlot={<Check className="text-active" />}
                    />
                  ) : (
                    <Button
                      variant="info-outline"
                      size="icon-xs"
                      aria-label={`Add ${spell.name}`}
                      iconSlot={<Plus />}
                      onClick={() => onAdd(spell.id)}
                    />
                  )
                }
              />
            )
          })}
        />
      )}

      <SpellDetail spell={detailSpell} open={!!detailSpell} onClose={() => setDetailSpell(null)} />
    </div>
  )
}
