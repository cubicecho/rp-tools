import { Combobox } from '@/components/combobox'
import { DialogLayout } from '@/components/dialog-layout'
import { FormField } from '@/components/form-field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  ABILITY_LABELS, abilityMod, formatMod, proficiencyBonus,
  spellcastingKey, spellSaveDC, spellAttackBonus,
} from '@/lib/stats'
import { cn } from '@/lib/utils'
import type { ClassData, AbilityScores, Character } from '@/types'

interface CharacterSheetProps {
  open: boolean
  onClose: () => void
  character: Character
  classes: ClassData[]
  onSetClass: (classId: string, edition: Character['edition']) => void
  onSetLevel: (level: number) => void
  onUpdateStats: (patch: Partial<AbilityScores>) => void
}

/** The full names, read out in place of the STR / DEX abbreviations on screen. */
const ABILITY_NAMES: Record<keyof AbilityScores, string> = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
}

const LEVEL_OPTIONS = Array.from({ length: 20 }, (_, i) => ({ value: String(i + 1), label: `Level ${i + 1}` }))

function SectionTitle({ id, children }: { id?: string; children: string }) {
  return <h3 id={id} className="text-xs text-foreground/60 uppercase tracking-wide">{children}</h3>
}

export function CharacterSheet({
  open, onClose, character, classes, onSetClass, onSetLevel, onUpdateStats,
}: CharacterSheetProps) {
  const prof = proficiencyBonus(character.level)
  const castKey = spellcastingKey(character.classId)
  const castMod = abilityMod(character.stats[castKey])
  const dc = spellSaveDC(character.level, character.classId, character.stats)
  const atk = spellAttackBonus(character.level, character.classId, character.stats)
  const currentClass = classes.find(c => c.id === character.classId)
  const classOptions = classes.map(c => ({ value: c.id, label: c.name }))

  const abilities = Object.keys(ABILITY_LABELS) as (keyof AbilityScores)[]

  // Every change is saved as it is made, so there is nothing to submit: the dialog only closes.
  return (
    <DialogLayout
      open={open}
      onOpenChange={o => { if (!o) onClose() }}
      title="Character"
      size="md"
      contentSlot={
        <>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Class"
              controlSlot={props => (
                <Combobox
                  {...props}
                  options={classOptions}
                  value={character.classId || undefined}
                  placeholder="Pick class…"
                  onValueChange={v => onSetClass(v, character.edition)}
                />
              )}
            />
            <FormField
              label="Level"
              controlSlot={props => (
                <Combobox
                  {...props}
                  options={LEVEL_OPTIONS}
                  value={String(character.level)}
                  onValueChange={v => onSetLevel(Number(v))}
                />
              )}
            />
          </div>

          <Separator />

          <section aria-labelledby="ability-scores" className="flex flex-col gap-2">
            <SectionTitle id="ability-scores">Ability Scores</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {abilities.map(key => {
                const isSpellcastingAbility = character.classId !== '' && castKey === key
                return (
                  <FormField
                    key={key}
                    className={cn('rounded-md border border-foreground/10 p-2 text-center', isSpellcastingAbility && 'border-active bg-active/10')}
                    label={
                      <>
                        <span aria-hidden>{ABILITY_LABELS[key]}</span>
                        <span className="sr-only">{ABILITY_NAMES[key]}</span>
                      </>
                    }
                    labelClassName="justify-center"
                    description={`Modifier ${formatMod(abilityMod(character.stats[key]))}`}
                    controlSlot={
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        className="text-center"
                        value={String(character.stats[key])}
                        onChangeText={v => onUpdateStats({ [key]: Math.min(30, Math.max(1, Number(v))) })}
                      />
                    }
                  />
                )
              })}
            </div>
          </section>

          <Separator />

          {currentClass ? (
            <section className="flex flex-col gap-2">
              <SectionTitle>Spellcasting</SectionTitle>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground/60">Ability</span>
                  <span className="font-medium">
                    {ABILITY_LABELS[castKey]} ({formatMod(castMod)})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">Proficiency</span>
                  <span className="font-medium">{formatMod(prof)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">Save DC</span>
                  <span className="font-semibold text-active">{dc}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">Attack Bonus</span>
                  <span className="font-semibold text-active">{formatMod(atk)}</span>
                </div>
              </div>
            </section>
          ) : (
            <p className="text-xs text-foreground/60">Select a class to see spellcasting stats.</p>
          )}
        </>
      }
    />
  )
}
