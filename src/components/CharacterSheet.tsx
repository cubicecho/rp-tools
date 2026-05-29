import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  ABILITY_LABELS, abilityMod, formatMod, proficiencyBonus,
  spellcastingKey, spellSaveDC, spellAttackBonus,
} from '@/lib/stats'
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

const LEVEL_OPTIONS = Array.from({ length: 20 }, (_, i) => i + 1)

export function CharacterSheet({
  open, onClose, character, classes, onSetClass, onSetLevel, onUpdateStats,
}: CharacterSheetProps) {
  const prof = proficiencyBonus(character.level)
  const castKey = spellcastingKey(character.classId)
  const castMod = abilityMod(character.stats[castKey])
  const dc = spellSaveDC(character.level, character.classId, character.stats)
  const atk = spellAttackBonus(character.level, character.classId, character.stats)
  const currentClass = classes.find(c => c.id === character.classId)

  const abilities = Object.keys(ABILITY_LABELS) as (keyof AbilityScores)[]

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Character</DialogTitle>
        </DialogHeader>

        {/* Class + Level */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Class</label>
            <Select value={character.classId || ''} onValueChange={v => onSetClass(v, character.edition)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Pick class…" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Level</label>
            <Select value={String(character.level)} onValueChange={v => onSetLevel(Number(v))}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVEL_OPTIONS.map(l => <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Ability scores */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Ability Scores</p>
          <div className="grid grid-cols-3 gap-2">
            {abilities.map(key => {
              const mod = abilityMod(character.stats[key])
              const isSpellcastingAbility = character.classId && castKey === key
              return (
                <div
                  key={key}
                  className={`flex flex-col items-center gap-1 rounded-md border p-2 ${isSpellcastingAbility ? 'border-primary/50 bg-primary/5' : ''}`}
                >
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {ABILITY_LABELS[key]}
                  </span>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={character.stats[key]}
                    onChange={e => onUpdateStats({ [key]: Math.min(30, Math.max(1, Number(e.target.value))) })}
                    className="h-8 w-full text-center text-sm p-1"
                  />
                  <span className="text-xs font-semibold">{formatMod(mod)}</span>
                </div>
              )
            })}
          </div>
        </div>

        <Separator />

        {/* Spellcasting stats */}
        {currentClass ? (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Spellcasting</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ability</span>
                <span className="font-medium">
                  {ABILITY_LABELS[castKey]} ({formatMod(castMod)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Proficiency</span>
                <span className="font-medium">{formatMod(prof)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Save DC</span>
                <span className="font-semibold text-primary">{dc}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Attack Bonus</span>
                <span className="font-semibold text-primary">{formatMod(atk)}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Select a class to see spellcasting stats.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
