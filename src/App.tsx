import { useState, useEffect, useMemo } from 'react'
import { BookOpen, Wand2, Swords } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SpellSlotTracker } from '@/components/SpellSlotTracker'
import { SpellBrowser } from '@/components/SpellBrowser'
import { MySpells } from '@/components/MySpells'
import { PlayView } from '@/components/PlayView'
import { useCharacter } from '@/hooks/useCharacter'
import { useSpells } from '@/hooks/useSpells'
import type { ClassData } from '@/types'

type View = 'manage' | 'play'

export default function App() {
  const [classes, setClasses] = useState<ClassData[]>([])
  const [view, setView] = useState<View>('play')
  const [mobilePanel, setMobilePanel] = useState<'mine' | 'browse'>('mine')

  useEffect(() => {
    fetch('/data/classes.json').then(r => r.json()).then(d => setClasses(d.classes))
  }, [])

  const {
    character,
    currentClass,
    setClass,
    setLevel,
    addSpell,
    removeSpell,
    togglePrepared,
    castSpell,
    doShortRest,
    doLongRest,
  } = useCharacter(classes)

  const { spells, loading, byId } = useSpells(character.edition)

  const knownIds = useMemo(() => new Set(character.knownSpells.map(s => s.spellId)), [character.knownSpells])

  const levelOptions = Array.from({ length: 20 }, (_, i) => i + 1)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          {/* Top row: logo + view switcher + class/level */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 shrink-0">
              <Wand2 className="h-5 w-5 text-primary" />
              <h1 className="font-semibold text-base">Spell Manager</h1>
              <Badge variant="outline" className="text-xs">5.5e</Badge>
            </div>

            {/* View toggle */}
            <div className="flex rounded-md border border-border overflow-hidden">
              <Button
                variant={view === 'manage' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-xs rounded-none border-0"
                onClick={() => setView('manage')}
              >
                <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                Manage
              </Button>
              <div className="w-px bg-border" />
              <Button
                variant={view === 'play' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-xs rounded-none border-0"
                onClick={() => setView('play')}
              >
                <Swords className="h-3.5 w-3.5 mr-1.5" />
                Play
              </Button>
            </div>

            {/* Class + level selectors */}
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <Select
                value={character.classId || ''}
                onValueChange={v => setClass(v, character.edition)}
              >
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="Pick class…" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(character.level)}
                onValueChange={v => setLevel(Number(v))}
              >
                <SelectTrigger className="h-8 w-24 text-xs">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  {levelOptions.map(l => (
                    <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Spell slot tracker — always visible when class is selected */}
          {currentClass && (
            <SpellSlotTracker
              character={character}
              currentClass={currentClass}
              onShortRest={doShortRest}
              onLongRest={doLongRest}
            />
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4">
        {!character.classId ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
            <Wand2 className="h-12 w-12 text-muted-foreground" />
            <h2 className="text-lg font-medium">Choose a class to get started</h2>
            <p className="text-sm text-muted-foreground">Select your class and level from the header above.</p>
          </div>
        ) : view === 'play' ? (
          /* ── Play view ── */
          loading ? (
            <p className="text-sm text-muted-foreground">Loading spells…</p>
          ) : (
            <PlayView
              knownSpells={character.knownSpells}
              spellById={byId}
              character={character}
              currentClass={currentClass}
              onTogglePrepared={togglePrepared}
              onCast={castSpell}
              onRemove={removeSpell}
            />
          )
        ) : (
          /* ── Manage view ── */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Spells panel */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm">My Spells</h2>
                <Badge variant="secondary" className="text-xs">{character.knownSpells.length}</Badge>
                <button
                  className="lg:hidden ml-auto text-xs text-primary underline"
                  onClick={() => setMobilePanel(mobilePanel === 'mine' ? 'browse' : 'mine')}
                >
                  {mobilePanel === 'mine' ? 'Browse →' : '← My Spells'}
                </button>
              </div>
              <Separator />
              <div className={mobilePanel === 'mine' ? 'block' : 'hidden lg:block'}>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading spells…</p>
                ) : (
                  <MySpells
                    knownSpells={character.knownSpells}
                    spellById={byId}
                    character={character}
                    currentClass={currentClass}
                    onTogglePrepared={togglePrepared}
                    onCast={castSpell}
                    onRemove={removeSpell}
                  />
                )}
              </div>
            </div>

            {/* Spell Browser panel */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm">{currentClass?.name} Spells</h2>
              </div>
              <Separator />
              <div className={mobilePanel === 'browse' ? 'block' : 'hidden lg:block'}>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading spells…</p>
                ) : (
                  <SpellBrowser
                    spells={spells}
                    knownIds={knownIds}
                    classId={character.classId}
                    onAdd={addSpell}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
