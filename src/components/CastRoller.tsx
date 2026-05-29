import { useState, useEffect } from 'react'
import { Dices } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { LEVEL_LABELS, SCHOOL_COLORS } from '@/lib/utils'
import { rollDice, upcastDice, formatMod, type DiceResult } from '@/lib/stats'
import type { Spell } from '@/types'

interface CastRollerProps {
  spell: Spell | null
  open: boolean
  availableSlots: number[]
  isPact: boolean
  pactSlotLevel: number
  spellSaveDC: number
  spellAttackBonus: number
  onCast: (slotLevel: number) => void
  onClose: () => void
}

export function CastRoller({
  spell, open, availableSlots, isPact, pactSlotLevel,
  spellSaveDC, spellAttackBonus, onCast, onClose,
}: CastRollerProps) {
  const [selectedSlot, setSelectedSlot] = useState<number>(0)
  const [hitRoll, setHitRoll] = useState<DiceResult | null>(null)
  const [damageRoll, setDamageRoll] = useState<DiceResult | null>(null)
  const [healRoll, setHealRoll] = useState<DiceResult | null>(null)

  // Reset state and pick default slot when spell changes
  useEffect(() => {
    if (!spell) return
    setHitRoll(null)
    setDamageRoll(null)
    setHealRoll(null)
    if (spell.level === 0) {
      setSelectedSlot(0)
    } else if (isPact) {
      setSelectedSlot(pactSlotLevel)
    } else {
      setSelectedSlot(availableSlots[0] ?? spell.level)
    }
  }, [spell, availableSlots, isPact, pactSlotLevel])

  if (!spell) return null

  const isCantrip = spell.level === 0
  const slotsAbove = isCantrip ? 0 : Math.max(0, selectedSlot - spell.level)

  const activeDamageDice =
    spell.damageDice && spell.higherLevelDice && slotsAbove > 0
      ? upcastDice(spell.damageDice, spell.higherLevelDice, slotsAbove)
      : spell.damageDice

  const schoolColor = SCHOOL_COLORS[spell.school] ?? 'bg-gray-100 text-gray-800 border-gray-300'

  function handleCast() {
    onCast(selectedSlot)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {spell.name}
            <Badge className={`border text-xs ${schoolColor}`}>{LEVEL_LABELS[spell.level]}</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Slot selection (leveled, non-pact, multiple options) */}
        {!isCantrip && !isPact && availableSlots.length > 1 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Cast at level</p>
            <div className="flex flex-wrap gap-1.5">
              {availableSlots.map(lvl => (
                <Button
                  key={lvl}
                  size="sm"
                  variant={selectedSlot === lvl ? 'default' : 'outline'}
                  className="h-7 text-xs"
                  onClick={() => { setSelectedSlot(lvl); setDamageRoll(null); setHitRoll(null) }}
                >
                  {LEVEL_LABELS[lvl]}
                </Button>
              ))}
            </div>
            {slotsAbove > 0 && spell.higherLevelDice && (
              <p className="text-xs text-muted-foreground">
                +{slotsAbove} level{slotsAbove > 1 ? 's' : ''}: adds {spell.higherLevelDice} per level
              </p>
            )}
          </div>
        )}

        {!isCantrip && !isPact && availableSlots.length > 1 && <Separator />}

        {/* Mechanic */}
        <div className="space-y-3">
          {/* Attack roll */}
          {spell.spellMechanic === 'attack' && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {spell.attackType === 'melee' ? 'Melee' : 'Ranged'} Spell Attack
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5"
                  onClick={() => setHitRoll(rollDice('1d20'))}
                >
                  <Dices className="h-3.5 w-3.5" />
                  Roll d20
                </Button>
                {hitRoll && (
                  <div className="text-sm">
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{hitRoll.total}</span>
                    <span className="text-muted-foreground ml-1">
                      {formatMod(spellAttackBonus)} = <span className="font-semibold text-foreground">{hitRoll.total + spellAttackBonus}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Save DC */}
          {spell.spellMechanic === 'save' && (
            <div className="space-y-1">
              <p className="text-sm font-medium">{spell.saveAbility} Saving Throw</p>
              <p className="text-muted-foreground text-xs">Target must beat:</p>
              <p className="text-3xl font-bold text-primary">DC {spellSaveDC}</p>
            </div>
          )}

          {/* Utility or damage (auto-hit) */}
          {(spell.spellMechanic === 'utility' || spell.spellMechanic === 'damage') && (
            <p className="text-sm text-muted-foreground">
              {spell.spellMechanic === 'damage' ? 'Automatically hits.' : 'No attack roll or saving throw.'}
            </p>
          )}

          {/* Damage dice */}
          {activeDamageDice && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Damage
                  {spell.damageType && <span className="text-muted-foreground font-normal ml-1">({spell.damageType})</span>}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">{activeDamageDice}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5"
                    onClick={() => setDamageRoll(rollDice(activeDamageDice))}
                  >
                    <Dices className="h-3.5 w-3.5" />
                    Roll
                  </Button>
                  {damageRoll && (
                    <div className="text-sm">
                      <span className="font-bold text-lg">{damageRoll.total}</span>
                      {damageRoll.rolls.length > 1 && (
                        <span className="text-muted-foreground text-xs ml-1">
                          ({damageRoll.rolls.join(', ')})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Healing dice */}
          {spell.healDice && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Healing</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">{spell.healDice}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5"
                    onClick={() => setHealRoll(rollDice(spell.healDice!))}
                  >
                    <Dices className="h-3.5 w-3.5" />
                    Roll
                  </Button>
                  {healRoll && (
                    <div className="text-sm">
                      <span className="font-bold text-lg">{healRoll.total}</span>
                      {healRoll.rolls.length > 1 && (
                        <span className="text-muted-foreground text-xs ml-1">
                          ({healRoll.rolls.join(', ')})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <Separator />

        <Button onClick={handleCast} className="w-full">
          Confirm Cast {!isCantrip && `(${LEVEL_LABELS[selectedSlot]})`}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
