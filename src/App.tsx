import { useState, useEffect, useMemo } from 'react'
import { BookOpen, Wand2, Swords, UserCircle, ScrollText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SpellSlotTracker } from '@/components/SpellSlotTracker'
import { SpellBrowser } from '@/components/SpellBrowser'
import { MySpells } from '@/components/MySpells'
import { PlayView } from '@/components/PlayView'
import { ReferenceView } from '@/components/ReferenceView'
import { CharacterSheet } from '@/components/CharacterSheet'
import { useCharacter } from '@/hooks/useCharacter'
import { useSpells } from '@/hooks/useSpells'
import { spellSaveDC, spellAttackBonus, formatMod } from '@/lib/stats'
import type { ClassData } from '@/types'

type View = 'manage' | 'play' | 'reference'

export default function App() {
  const [classes, setClasses] = useState<ClassData[]>([])
  const [view, setView] = useState<View>('play')
  const [mobilePanel, setMobilePanel] = useState<'mine' | 'browse'>('mine')
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/classes.json`).then(r => r.json()).then(d => setClasses(d.classes))
  }, [])

  const {
    character,
    currentClass,
    setClass,
    setLevel,
    updateStats,
    addSpell,
    removeSpell,
    togglePrepared,
    castSpell,
    doShortRest,
    doLongRest,
  } = useCharacter(classes)

  const { spells, loading, byId } = useSpells(character.edition)

  const knownIds = useMemo(() => new Set(character.knownSpells.map(s => s.spellId)), [character.knownSpells])

  const dc = currentClass ? spellSaveDC(character.level, character.classId, character.stats) : null
  const atk = currentClass ? spellAttackBonus(character.level, character.classId, character.stats) : null

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          {/* Top row */}
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
              <div className="w-px bg-border" />
              <Button
                variant={view === 'reference' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-xs rounded-none border-0"
                onClick={() => setView('reference')}
              >
                <ScrollText className="h-3.5 w-3.5 mr-1.5" />
                Reference
              </Button>
            </div>

            {/* Spellcasting summary + character button */}
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              {currentClass && dc !== null && atk !== null && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    <span className="text-muted-foreground">DC </span>
                    <span className="font-semibold text-foreground">{dc}</span>
                  </span>
                  <span>
                    <span className="text-muted-foreground">Atk </span>
                    <span className="font-semibold text-foreground">{formatMod(atk)}</span>
                  </span>
                  <span className="text-muted-foreground">
                    {currentClass.name} {character.level}
                  </span>
                </div>
              )}
              <Button
                variant={character.classId ? 'outline' : 'default'}
                size="sm"
                className="h-7 px-2 gap-1.5 text-xs"
                onClick={() => setSheetOpen(true)}
              >
                <UserCircle className="h-3.5 w-3.5" />
                {character.classId ? 'Character' : 'Set up character'}
              </Button>
            </div>
          </div>

          {/* Spell slot tracker */}
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
            <p className="text-sm text-muted-foreground">
              Click <strong>Set up character</strong> in the header.
            </p>
          </div>
        ) : view === 'reference' ? (
          loading ? (
            <p className="text-sm text-muted-foreground">Loading spells…</p>
          ) : (
            <ReferenceView
              knownSpells={character.knownSpells}
              spellById={byId}
            />
          )
        ) : view === 'play' ? (
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

      <CharacterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        character={character}
        classes={classes}
        onSetClass={setClass}
        onSetLevel={setLevel}
        onUpdateStats={updateStats}
      />
    </div>
  )
}
