import { useState, useEffect, useMemo, type ReactNode } from 'react'
import { BookOpen, WandSparkles, Swords, CircleUser, ScrollText } from 'lucide-react'
import { HeaderContentFooter, PAGE_COLUMN } from '@/components/header-content-footer'
import { EmptyState } from '@/components/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SegmentedButton, SegmentedGroup } from '@/components/ui/segmented'
import { useThemePreference } from '@/components/ui/theme-preference'
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
  // Follows the OS between light and dark, and applies a stored choice if one is ever made.
  useThemePreference()

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
  const openSheet = () => setSheetOpen(true)
  const goToManage = () => setView('manage')

  const header = (
    <div className={`${PAGE_COLUMN} flex flex-col gap-3 py-3`}>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 shrink-0">
          <WandSparkles className="h-5 w-5 text-active" aria-hidden />
          <h1 className="font-semibold text-base">Spell Manager</h1>
          <Badge variant="outline">5.5e</Badge>
        </div>

        <SegmentedGroup aria-label="View" labelHideBelow="sm" value={view} onValueChange={setView}>
          <SegmentedButton value="manage" iconSlot={<BookOpen />}>Manage</SegmentedButton>
          <SegmentedButton value="play" iconSlot={<Swords />}>Play</SegmentedButton>
          <SegmentedButton value="reference" iconSlot={<ScrollText />}>Reference</SegmentedButton>
        </SegmentedGroup>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {currentClass && dc !== null && atk !== null && (
            <div className="flex items-center gap-3 text-xs text-foreground/60">
              <span>
                DC <span className="font-semibold text-foreground">{dc}</span>
              </span>
              <span>
                Atk <span className="font-semibold text-foreground">{formatMod(atk)}</span>
              </span>
              <span>
                {currentClass.name} {character.level}
              </span>
            </div>
          )}
          <Button
            variant={character.classId ? 'outline' : 'default'}
            size="sm"
            iconSlot={<CircleUser />}
            content={character.classId ? 'Character' : 'Set up character'}
            onClick={openSheet}
          />
        </div>
      </div>

      {currentClass && (
        <SpellSlotTracker
          character={character}
          currentClass={currentClass}
          onShortRest={doShortRest}
          onLongRest={doLongRest}
        />
      )}
    </div>
  )

  let body: ReactNode
  if (!character.classId) {
    body = (
      <EmptyState
        level={2}
        iconSlot={<WandSparkles />}
        title="Choose a class to get started"
        description="Pick a class and a level, and the spells it can learn are listed for you."
        actionSlot={<Button iconSlot={<CircleUser />} content="Set up character" onClick={openSheet} />}
      />
    )
  } else if (loading) {
    body = <p className="text-sm text-foreground/60">Loading spells…</p>
  } else if (view === 'reference') {
    body = <ReferenceView knownSpells={character.knownSpells} spellById={byId} onManage={goToManage} />
  } else if (view === 'play') {
    body = (
      <PlayView
        knownSpells={character.knownSpells}
        spellById={byId}
        character={character}
        currentClass={currentClass}
        onTogglePrepared={togglePrepared}
        onCast={castSpell}
        onRemove={removeSpell}
        onManage={goToManage}
      />
    )
  } else {
    body = (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section aria-labelledby="my-spells-heading" className="flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-foreground/10 pb-2">
            <BookOpen className="h-4 w-4 text-active" aria-hidden />
            <h2 id="my-spells-heading" className="font-semibold text-sm">My Spells</h2>
            <Badge variant="secondary">{character.knownSpells.length}</Badge>
            <Button
              variant="outline"
              size="xs"
              className="lg:hidden ml-auto"
              content={mobilePanel === 'mine' ? 'Browse →' : '← My Spells'}
              onClick={() => setMobilePanel(mobilePanel === 'mine' ? 'browse' : 'mine')}
            />
          </div>
          <div className={mobilePanel === 'mine' ? 'block' : 'hidden lg:block'}>
            <MySpells
              knownSpells={character.knownSpells}
              spellById={byId}
              character={character}
              currentClass={currentClass}
              onTogglePrepared={togglePrepared}
              onCast={castSpell}
              onRemove={removeSpell}
            />
          </div>
        </section>

        <section aria-labelledby="class-spells-heading" className="flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-foreground/10 pb-2">
            <WandSparkles className="h-4 w-4 text-active" aria-hidden />
            <h2 id="class-spells-heading" className="font-semibold text-sm">{currentClass?.name} Spells</h2>
          </div>
          <div className={mobilePanel === 'browse' ? 'block' : 'hidden lg:block'}>
            <SpellBrowser spells={spells} knownIds={knownIds} classId={character.classId} onAdd={addSpell} />
          </div>
        </section>
      </div>
    )
  }

  return (
    <>
      {/* The header stays put and the body scrolls under it, so no list has to guess the
          header's height with a calc(100vh - …) of its own. */}
      <HeaderContentFooter
        scroll
        className="h-full"
        width="page"
        headerWidth="full"
        headerClassName="border-b border-foreground/10 bg-card px-4"
        headerSlot={header}
        contentClassName="py-4"
        contentSlot={<main>{body}</main>}
      />

      <CharacterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        character={character}
        classes={classes}
        onSetClass={setClass}
        onSetLevel={setLevel}
        onUpdateStats={updateStats}
      />
    </>
  )
}
