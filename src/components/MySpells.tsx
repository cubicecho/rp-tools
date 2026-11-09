import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { SearchInput } from '@/components/ui/search-input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SpellCard } from '@/components/SpellCard'
import { SpellDetail } from '@/components/SpellDetail'
import { getPactSlotLevel } from '@/lib/spellSlots'
import { spellSaveDC, spellAttackBonus } from '@/lib/stats'
import type { Spell, KnownSpell, ClassData, Character } from '@/types'

interface MySpellsProps {
  knownSpells: KnownSpell[]
  spellById: Map<string, Spell>
  character: Character
  currentClass: ClassData | undefined
  onTogglePrepared: (spellId: string) => void
  onCast: (slotLevel: number) => void
  onRemove: (spellId: string) => void
}

export function MySpells({
  knownSpells,
  spellById,
  character,
  currentClass,
  onTogglePrepared,
  onCast,
  onRemove,
}: MySpellsProps) {
  const [search, setSearch] = useState('')
  const [detailSpell, setDetailSpell] = useState<Spell | null>(null)
  const [tab, setTab] = useState('all')

  const isPact = currentClass?.spellcastingType === 'pact'
  const pactSlotLevel = currentClass ? getPactSlotLevel(currentClass, character.level) : 0
  const dc = currentClass ? spellSaveDC(character.level, character.classId, character.stats) : 0
  const atk = currentClass ? spellAttackBonus(character.level, character.classId, character.stats) : 0

  const resolved = knownSpells
    .map(ks => ({ ks, spell: spellById.get(ks.spellId) }))
    .filter((x): x is { ks: KnownSpell; spell: Spell } => x.spell !== undefined)

  const filtered = resolved.filter(({ ks, spell }) => {
    if (search && !spell.name.toLowerCase().includes(search.toLowerCase())) return false
    if (tab === 'prepared' && spell.level > 0 && !ks.prepared) return false
    return true
  })

  const cantripCount = filtered.filter(x => x.spell.level === 0).length
  const preparedCount = resolved.filter(x => x.spell.level > 0 && x.ks.prepared).length

  return (
    <div className="flex flex-col gap-3">
      <SearchInput label="Search my spells" placeholder="Search spells…" value={search} onChangeText={setSearch} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList aria-label="Which spells" className="w-full">
          <TabsTrigger value="all" className="flex-1">
            All ({resolved.length})
          </TabsTrigger>
          <TabsTrigger value="prepared" className="flex-1">
            Prepared ({preparedCount + cantripCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-2">
          {resolved.length === 0 ? (
            <EmptyState
              iconSlot={<BookOpen />}
              title="No spells yet"
              description="Add some from the class spell list."
            />
          ) : filtered.length === 0 ? (
            <EmptyState compact title="No spells match your filter." />
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {filtered.map(({ ks, spell }) => (
                <SpellCard
                  key={spell.id}
                  spell={spell}
                  prepared={ks.prepared}
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
        </TabsContent>
      </Tabs>

      <SpellDetail spell={detailSpell} open={!!detailSpell} onClose={() => setDetailSpell(null)} />
    </div>
  )
}
