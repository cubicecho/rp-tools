import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SpellCard } from '@/components/SpellCard'
import { SpellDetail } from '@/components/SpellDetail'
import { getPactSlotLevel } from '@/lib/spellSlots'
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
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search spells…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 text-sm"
        />
        {search && (
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setSearch('')}>
            ✕
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1 text-xs">
            All ({resolved.length})
          </TabsTrigger>
          <TabsTrigger value="prepared" className="flex-1 text-xs">
            Prepared ({preparedCount + cantripCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {resolved.length === 0 ? 'No spells yet — browse the spell list to add some.' : 'No spells match your filter.'}
            </p>
          ) : (
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="grid grid-cols-1 gap-2 pr-3">
                {filtered.map(({ ks, spell }) => (
                  <SpellCard
                    key={spell.id}
                    spell={spell}
                    prepared={ks.prepared}
                    currentSlots={character.currentSlots}
                    currentPactSlots={character.currentPactSlots}
                    pactSlotLevel={pactSlotLevel}
                    isPact={isPact}
                    onTogglePrepared={() => onTogglePrepared(spell.id)}
                    onCast={onCast}
                    onRemove={() => onRemove(spell.id)}
                    onDetail={() => setDetailSpell(spell)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      <SpellDetail spell={detailSpell} open={!!detailSpell} onClose={() => setDetailSpell(null)} />
    </div>
  )
}
