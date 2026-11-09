import { useState, useEffect } from 'react'
import { Dices } from 'lucide-react'
import { DialogLayout } from '@/components/dialog-layout'
import { schoolColor } from '@/components/SpellFacts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw } from '@/components/ui/icons'
import { SegmentedButton, SegmentedGroup } from '@/components/ui/segmented'
import { Separator } from '@/components/ui/separator'
import { LEVEL_LABELS } from '@/lib/spell-labels'
import { cn } from '@/lib/utils'
import { rollDice, upcastDice, scaleCantripDice, formatMod, type DiceResult } from '@/lib/stats'
import type { Spell } from '@/types'

interface RollResult {
  attacks: DiceResult[]   // one per hit for attack spells
  damages: DiceResult[]   // one per hit (or one total for save spells)
  heal: DiceResult | null
}

interface CastRollerProps {
  spell: Spell | null
  open: boolean
  availableSlots: number[]
  isPact: boolean
  pactSlotLevel: number
  spellSaveDC: number
  spellAttackBonus: number
  characterLevel: number
  onCast: (slotLevel: number) => void
  onClose: () => void
}

export function CastRoller({
  spell, open, availableSlots, isPact, pactSlotLevel,
  spellSaveDC, spellAttackBonus, characterLevel, onCast, onClose,
}: CastRollerProps) {
  const [selectedSlot, setSelectedSlot] = useState(0)
  const [result, setResult] = useState<RollResult | null>(null)

  useEffect(() => {
    if (!spell) return
    setResult(null)
    if (spell.level === 0) setSelectedSlot(0)
    else if (isPact) setSelectedSlot(pactSlotLevel)
    else setSelectedSlot(availableSlots[0] ?? spell.level)
  }, [spell, availableSlots, isPact, pactSlotLevel])

  useEffect(() => { setResult(null) }, [selectedSlot])

  if (!spell) return null

  const isCantrip = spell.level === 0
  const slotsAbove = isCantrip ? 0 : Math.max(0, selectedSlot - spell.level)
  const isMultiHit = (spell.hitCount ?? 1) > 1
  const nHits = isMultiHit
    ? (spell.hitCount ?? 1) + (spell.hitsScaleWithLevel ? slotsAbove : 0)
    : 1

  // Single-hit damage dice — cantrip level scaling takes priority over slot upcast
  const baseDamageDice = spell.cantripScaling && spell.damageDice
    ? scaleCantripDice(spell.damageDice, characterLevel)
    : spell.damageDice

  const singleDamageDice =
    !isMultiHit && baseDamageDice && spell.higherLevelDice && slotsAbove > 0
      ? upcastDice(baseDamageDice, spell.higherLevelDice, slotsAbove)
      : baseDamageDice

  const showSlotPicker = !isCantrip && !isPact && availableSlots.length > 1

  function rollAll() {
    // Re-narrow inside the closure — TS widens the captured prop back to Spell | null here.
    const s = spell
    if (!s) return
    const attacks: DiceResult[] = []
    const damages: DiceResult[] = []

    if (isMultiHit && s.attackPerHit) {
      // e.g. Scorching Ray — one attack + one damage per hit
      for (let i = 0; i < nHits; i++) {
        attacks.push(rollDice('1d20'))
        if (s.damageDice) damages.push(rollDice(s.damageDice))
      }
    } else if (isMultiHit && !s.attackPerHit) {
      // e.g. Magic Missile — one damage per dart, no attack
      for (let i = 0; i < nHits; i++) {
        if (s.damageDice) damages.push(rollDice(s.damageDice))
      }
    } else if (s.spellMechanic === 'attack' && singleDamageDice) {
      // Single-hit attack (Fire Bolt etc.)
      attacks.push(rollDice('1d20'))
      damages.push(rollDice(singleDamageDice))
    } else if (singleDamageDice) {
      // Save or auto-hit damage (Fireball etc.)
      damages.push(rollDice(singleDamageDice))
    }

    const heal = s.healDice ? rollDice(s.healDice) : null
    setResult({ attacks, damages, heal })
  }

  const hasRollable =
    spell.spellMechanic !== 'utility' ||
    !!spell.damageDice ||
    !!spell.healDice

  return (
    <DialogLayout
      open={open}
      onOpenChange={o => { if (!o) onClose() }}
      size="sm"
      title={spell.name}
      actionSlot={<Badge className={cn('border', schoolColor(spell))}>{LEVEL_LABELS[spell.level]}</Badge>}
      actionPlacement="inline"
      footerActionsSlot={
        <Button
          variant="positive"
          content={`Confirm Cast${isCantrip ? '' : ` (${LEVEL_LABELS[selectedSlot]})`}`}
          onClick={handleCast}
        />
      }
      contentSlot={<>

        {/* Slot picker */}
        {showSlotPicker && (
          <>
            <div className="space-y-1.5">
              <p id="cast-level" className="text-xs text-foreground/60 uppercase tracking-wide">Cast at level</p>
              <SegmentedGroup
                aria-labelledby="cast-level"
                variant="plain"
                className="flex-wrap"
                value={String(selectedSlot)}
                onValueChange={v => setSelectedSlot(Number(v))}
              >
                {availableSlots.map(lvl => (
                  <SegmentedButton key={lvl} value={String(lvl)}>{LEVEL_LABELS[lvl]}</SegmentedButton>
                ))}
              </SegmentedGroup>
            </div>
            <Separator />
          </>
        )}

        {/* Mechanic summary */}
        <div className="space-y-1">
          {spell.spellMechanic === 'attack' || (isMultiHit && spell.attackPerHit) ? (
            <p className="text-sm text-foreground/60">
              {isMultiHit
                ? `${nHits} ${spell.attackType === 'melee' ? 'melee' : 'ranged'} attacks`
                : `${spell.attackType === 'melee' ? 'Melee' : 'Ranged'} spell attack`}
              {slotsAbove > 0 && spell.hitsScaleWithLevel && (
                <span className="ml-1 text-xs">(+{slotsAbove} from upcast)</span>
              )}
            </p>
          ) : spell.spellMechanic === 'save' ? (
            <div className="flex items-baseline gap-3">
              <span className="text-sm text-foreground/60">{spell.saveAbility} save — DC</span>
              <span className="text-2xl font-bold text-active">{spellSaveDC}</span>
            </div>
          ) : isMultiHit ? (
            <p className="text-sm text-foreground/60">
              {nHits} auto-hit darts
              {slotsAbove > 0 && spell.hitsScaleWithLevel && <span className="ml-1 text-xs">(+{slotsAbove})</span>}
            </p>
          ) : (
            <p className="text-sm text-foreground/60">
              {spell.spellMechanic === 'damage' ? 'Automatically hits' : 'Utility — no attack or save'}
            </p>
          )}

          {/* Dice summary line */}
          {(spell.damageDice || spell.healDice) && (
            <p className="text-xs text-foreground/60">
              {isMultiHit
                ? `${spell.damageDice} per hit`
                : singleDamageDice ?? spell.damageDice}
              {spell.damageType && ` ${spell.damageType}`}
              {spell.healDice && ` · ${spell.healDice} healing`}
            </p>
          )}
        </div>

        {/* Roll / Re-roll button */}
        {hasRollable && (
          <Button
            className="w-full"
            iconSlot={result ? <RefreshCw /> : <Dices />}
            content={result ? 'Re-roll' : 'Roll'}
            onClick={rollAll}
          />
        )}

        {/* Results table */}
        {result && (
          <div className="rounded-md border border-foreground/10 overflow-hidden text-sm">
            {/* Multi-hit attack (Scorching Ray) */}
            {result.attacks.length > 1 && (
              <>
                <div className="grid grid-cols-[2rem_1fr_1fr] bg-secondary px-3 py-1.5 text-xs font-medium text-foreground/60 border-b border-foreground/10">
                  <span>#</span><span>Attack</span>
                  <span>Damage{spell.damageType ? ` (${spell.damageType})` : ''}</span>
                </div>
                {result.attacks.map((atk, i) => (
                  <div key={i} className="grid grid-cols-[2rem_1fr_1fr] px-3 py-2 border-b border-foreground/10 last:border-0 items-center">
                    <span className="text-foreground/60 text-xs">{i + 1}</span>
                    <span>
                      <span className="text-foreground/60 text-xs">{atk.total}{formatMod(spellAttackBonus)} = </span>
                      <span className="font-semibold">{atk.total + spellAttackBonus}</span>
                    </span>
                    <span className="font-semibold">{result.damages[i]?.total ?? '—'}</span>
                  </div>
                ))}
              </>
            )}

            {/* Single-hit attack */}
            {result.attacks.length === 1 && result.damages.length === 1 && (
              <>
                <div className="grid grid-cols-[5rem_1fr] bg-secondary px-3 py-1.5 text-xs font-medium text-foreground/60 border-b border-foreground/10">
                  <span></span><span>Result</span>
                </div>
                <div className="grid grid-cols-[5rem_1fr] px-3 py-2 border-b border-foreground/10 items-center">
                  <span className="text-xs text-foreground/60">Attack</span>
                  <span>
                    <span className="text-foreground/60 text-xs">{result.attacks[0].total}{formatMod(spellAttackBonus)} = </span>
                    <span className="font-semibold">{result.attacks[0].total + spellAttackBonus}</span>
                  </span>
                </div>
                <div className="grid grid-cols-[5rem_1fr] px-3 py-2 items-center">
                  <span className="text-xs text-foreground/60">
                    Damage{spell.damageType ? ` (${spell.damageType})` : ''}
                  </span>
                  <span>
                    <span className="font-semibold text-base">{result.damages[0].total}</span>
                    {result.damages[0].rolls.length > 1 && (
                      <span className="text-foreground/60 text-xs ml-1.5">
                        ({result.damages[0].rolls.join('+')})
                      </span>
                    )}
                  </span>
                </div>
              </>
            )}

            {/* Multi-hit auto-hit (Magic Missile) */}
            {result.attacks.length === 0 && result.damages.length > 1 && (
              <>
                <div className="grid grid-cols-[2rem_1fr] bg-secondary px-3 py-1.5 text-xs font-medium text-foreground/60 border-b border-foreground/10">
                  <span>#</span>
                  <span>Damage{spell.damageType ? ` (${spell.damageType})` : ''}</span>
                </div>
                {result.damages.map((dmg, i) => (
                  <div key={i} className="grid grid-cols-[2rem_1fr] px-3 py-2 border-b border-foreground/10 items-center">
                    <span className="text-foreground/60 text-xs">{i + 1}</span>
                    <span className="font-semibold">{dmg.total}
                      {dmg.rolls.length > 1 && (
                        <span className="text-foreground/60 font-normal text-xs ml-1.5">({dmg.rolls.join('+')})</span>
                      )}
                    </span>
                  </div>
                ))}
                <div className="grid grid-cols-[2rem_1fr] px-3 py-2 bg-secondary items-center">
                  <span className="text-xs text-foreground/60 font-medium">∑</span>
                  <span className="font-bold text-active">
                    {result.damages.reduce((s, d) => s + d.total, 0)}
                  </span>
                </div>
              </>
            )}

            {/* Save / single damage */}
            {result.attacks.length === 0 && result.damages.length === 1 && (
              <div className="px-3 py-2">
                <span className="text-xs text-foreground/60">
                  Damage{spell.damageType ? ` (${spell.damageType})` : ''}{' — '}
                </span>
                <span className="font-bold text-base">{result.damages[0].total}</span>
                {result.damages[0].rolls.length > 1 && (
                  <span className="text-foreground/60 text-xs ml-1.5">
                    ({result.damages[0].rolls.join('+')})
                  </span>
                )}
              </div>
            )}

            {/* Healing */}
            {result.heal && (
              <div className="px-3 py-2 border-t border-foreground/10">
                <span className="text-xs text-foreground/60">Healing — </span>
                <span className="font-bold text-base">{result.heal.total}</span>
                {result.heal.rolls.length > 1 && (
                  <span className="text-foreground/60 text-xs ml-1.5">
                    ({result.heal.rolls.join('+')})
                  </span>
                )}
              </div>
            )}
          </div>
        )}

      </>}
    />
  )

  function handleCast() {
    onCast(selectedSlot)
    onClose()
  }
}
