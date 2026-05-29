import { useState, useMemo } from 'react'
import { Plus, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SpellDetail } from '@/components/SpellDetail'
import { SCHOOL_COLORS, LEVEL_LABELS } from '@/lib/utils'
import type { Spell } from '@/types'

const SCHOOLS = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation']

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

  const availableLevels = useMemo(() => {
    const levels = new Set(classSpells.map(s => s.level))
    return Array.from(levels).sort((a, b) => a - b)
  }, [classSpells])

  return (
    <div className="flex flex-col h-full gap-3">
      <Input
        placeholder="Search spells…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="h-8 text-sm"
      />

      <div className="flex gap-2">
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="h-8 text-xs flex-1">
            <SelectValue placeholder="All levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {availableLevels.map(lvl => (
              <SelectItem key={lvl} value={String(lvl)}>{LEVEL_LABELS[lvl]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={schoolFilter} onValueChange={setSchoolFilter}>
          <SelectTrigger className="h-8 text-xs flex-1">
            <SelectValue placeholder="All schools" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All schools</SelectItem>
            {SCHOOLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} spells</p>

      <ScrollArea className="h-[calc(100vh-330px)]">
        <div className="space-y-1 pr-3">
          {filtered.map(spell => {
            const known = knownIds.has(spell.id)
            const schoolColor = SCHOOL_COLORS[spell.school] ?? 'bg-gray-100 text-gray-800 border-gray-300'
            return (
              <div
                key={spell.id}
                className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent cursor-pointer group"
                onClick={() => setDetailSpell(spell)}
              >
                <Badge className={`border text-xs shrink-0 ${schoolColor}`}>
                  {LEVEL_LABELS[spell.level]}
                </Badge>
                <span className="text-sm flex-1 min-w-0 truncate">{spell.name}</span>
                <span className="text-xs text-muted-foreground shrink-0 hidden group-hover:block">
                  {spell.school}
                </span>
                <Button
                  variant={known ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 w-7 p-0 shrink-0"
                  onClick={e => { e.stopPropagation(); if (!known) onAdd(spell.id) }}
                  title={known ? 'Already known' : 'Add to spells'}
                >
                  {known ? <Check className="h-3.5 w-3.5 text-primary" /> : <Plus className="h-3.5 w-3.5" />}
                </Button>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      <SpellDetail spell={detailSpell} open={!!detailSpell} onClose={() => setDetailSpell(null)} />
    </div>
  )
}
