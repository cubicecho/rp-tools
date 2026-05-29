import { useState, useEffect } from 'react'
import { Dices } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { LEVEL_LABELS, SCHOOL_COLORS } from '@/lib/utils'
import { rollDice, upcastDice, formatMod, type DiceResult } from '@/lib/stats'
import type { Spell } from '@/types'

interface HitResult {
  attack: DiceResult | null
  damage: DiceResult | null
}

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
  const [selectedSlot, setSelectedSlot] = useState(0)
  const [singleHitRoll, setSingleHitRoll] = useState<DiceResult | null>(null)
  const [singleDmgRoll, setSingleDmgRoll] = useState<DiceResult | null>(null)
  const [singleHealRoll, setSingleHealRoll] = useState<DiceResult | null>(null)
  const [perHitResults, setPerHitResults] = useState<HitResult[]>([])

  useEffect(() => {
    if (!spell) return
    setSingleHitRoll(null); setSingleDmgRoll(null); setSingleHealRoll(null)
    if (spell.level === 0) setSelectedSlot(0)
    else if (isPact) setSelectedSlot(pactSlotLevel)
    else setSelectedSlot(availableSlots[0] ?? spell.level)
  }, [spell, availableSlots, isPact, pactSlotLevel])

  // Reset per-hit results whenever slot or spell changes
  useEffect(() => {
    if (!spell) return
    const n = effectiveHitCount(spell, selectedSlot)
    setPerHitResults(Array.from({ length: n }, () => ({ attack: null, damage: null })))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spell?.id, selectedSlot])

  if (!spell) return null

  const isCantrip = spell.level === 0
  const slotsAbove = isCantrip ? 0 : Math.max(0, selectedSlot - spell.level)
  const isMultiHit = (spell.hitCount ?? 1) > 1
  const schoolColor = SCHOOL_COLORS[spell.school] ?? 'bg-gray-100 text-gray-800 border-gray-300'

  function effectiveHitCount(s: Spell, slot: number): number {
    const base = s.hitCount ?? 1
    if (!s.hitsScaleWithLevel || s.level === 0) return base
    return base + Math.max(0, slot - s.level)
  }

  const nHits = effectiveHitCount(spell, selectedSlot)

  // For single-hit spells, compute total damage dice with upcast
  const singleDamageDice =
    spell.damageDice && !isMultiHit && spell.higherLevelDice && slotsAbove > 0
      ? upcastDice(spell.damageDice, spell.higherLevelDice, slotsAbove)
      : spell.damageDice

  // For multi-hit auto-hit: combine into one roll (e.g. 3d4 for 3 Magic Missiles)
  function multiAutoHitExpression(): string | null {
    if (!spell.damageDice) return null
    const m = spell.damageDice.match(/^(\d+)d(\d+)$/)
    if (!m) return spell.damageDice
    return `${parseInt(m[1]) * nHits}d${m[2]}`
  }

  function rollPerHitAttack(i: number) {
    const result = rollDice('1d20')
    setPerHitResults(prev => prev.map((r, idx) => idx === i ? { ...r, attack: result } : r))
  }

  function rollPerHitDamage(i: number) {
    if (!spell.damageDice) return
    const result = rollDice(spell.damageDice)
    setPerHitResults(prev => prev.map((r, idx) => idx === i ? { ...r, damage: result } : r))
  }

  function changeSlot(lvl: number) {
    setSelectedSlot(lvl)
    setSingleHitRoll(null); setSingleDmgRoll(null)
  }

  function handleCast() {
    onCast(selectedSlot)
    onClose()
  }

  const showSlotPicker = !isCantrip && !isPact && availableSlots.length > 1

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {spell.name}
            <Badge className={`border text-xs ${schoolColor}`}>{LEVEL_LABELS[spell.level]}</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Slot picker */}
        {showSlotPicker && (
          <>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Cast at level</p>
              <div className="flex flex-wrap gap-1.5">
                {availableSlots.map(lvl => (
                  <Button key={lvl} size="sm" variant={selectedSlot === lvl ? 'default' : 'outline'}
                    className="h-7 text-xs" onClick={() => changeSlot(lvl)}>
                    {LEVEL_LABELS[lvl]}
                  </Button>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        <div className="space-y-4">

          {/* ── Multi-hit attack (Scorching Ray etc.) ── */}
          {isMultiHit && spell.attackPerHit && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {nHits} {spell.attackType === 'melee' ? 'Melee' : 'Ranged'} Attacks
                {slotsAbove > 0 && spell.hitsScaleWithLevel && (
                  <span className="text-muted-foreground font-normal text-xs ml-2">(+{slotsAbove} from upcast)</span>
                )}
              </p>
              <div className="space-y-2">
                {perHitResults.map((hit, i) => (
                  <div key={i} className="flex items-center gap-2 flex-wrap p-2 rounded-md bg-muted/40">
                    <span className="text-xs text-muted-foreground w-10 shrink-0">Hit {i + 1}</span>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                      onClick={() => rollPerHitAttack(i)}>
                      <Dices className="h-3 w-3" /> d20
                    </Button>
                    {hit.attack && (
                      <>
                        <span className="text-xs">
                          <span className="font-mono">{hit.attack.total}</span>
                          <span className="text-muted-foreground"> {formatMod(spellAttackBonus)} = </span>
                          <span className="font-semibold">{hit.attack.total + spellAttackBonus}</span>
                        </span>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                          onClick={() => rollPerHitDamage(i)}>
                          <Dices className="h-3 w-3" /> {spell.damageDice}
                        </Button>
                        {hit.damage && (
                          <span className="font-bold">{hit.damage.total}
                            {spell.damageType && <span className="text-muted-foreground font-normal text-xs ml-1">{spell.damageType}</span>}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Multi-hit auto-hit (Magic Missile etc.) ── */}
          {isMultiHit && !spell.attackPerHit && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {nHits} darts — auto-hits
                {slotsAbove > 0 && spell.hitsScaleWithLevel && (
                  <span className="text-muted-foreground font-normal text-xs ml-2">(+{slotsAbove} from upcast)</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{spell.damageDice} per dart{spell.damageType && ` (${spell.damageType})`}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">{multiAutoHitExpression()}</span>
                <Button size="sm" variant="outline" className="h-8 gap-1.5"
                  onClick={() => { const expr = multiAutoHitExpression(); if (expr) setSingleDmgRoll(rollDice(expr)) }}>
                  <Dices className="h-3.5 w-3.5" /> Roll all
                </Button>
                {singleDmgRoll && (
                  <div className="text-sm">
                    <span className="font-bold text-lg">{singleDmgRoll.total}</span>
                    {singleDmgRoll.rolls.length > 1 && (
                      <span className="text-muted-foreground text-xs ml-1">({singleDmgRoll.rolls.join(', ')})</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Single-hit attack ── */}
          {!isMultiHit && spell.spellMechanic === 'attack' && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {spell.attackType === 'melee' ? 'Melee' : 'Ranged'} Spell Attack
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="h-8 gap-1.5"
                  onClick={() => setSingleHitRoll(rollDice('1d20'))}>
                  <Dices className="h-3.5 w-3.5" /> Roll d20
                </Button>
                {singleHitRoll && (
                  <span className="text-sm">
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{singleHitRoll.total}</span>
                    <span className="text-muted-foreground ml-1">
                      {formatMod(spellAttackBonus)} = <span className="font-semibold">{singleHitRoll.total + spellAttackBonus}</span>
                    </span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── Save ── */}
          {spell.spellMechanic === 'save' && (
            <div className="space-y-1">
              <p className="text-sm font-medium">{spell.saveAbility} Saving Throw</p>
              <p className="text-muted-foreground text-xs">Target must beat:</p>
              <p className="text-3xl font-bold text-primary">DC {spellSaveDC}</p>
            </div>
          )}

          {/* ── Utility / auto-hit single ── */}
          {!isMultiHit && (spell.spellMechanic === 'utility' || spell.spellMechanic === 'damage') && (
            <p className="text-sm text-muted-foreground">
              {spell.spellMechanic === 'damage' ? 'Automatically hits.' : 'No attack roll or saving throw.'}
            </p>
          )}

          {/* ── Single-hit damage ── */}
          {!isMultiHit && singleDamageDice && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Damage
                  {spell.damageType && <span className="text-muted-foreground font-normal ml-1">({spell.damageType})</span>}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">{singleDamageDice}</span>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5"
                    onClick={() => setSingleDmgRoll(rollDice(singleDamageDice))}>
                    <Dices className="h-3.5 w-3.5" /> Roll
                  </Button>
                  {singleDmgRoll && (
                    <div className="text-sm">
                      <span className="font-bold text-lg">{singleDmgRoll.total}</span>
                      {singleDmgRoll.rolls.length > 1 && (
                        <span className="text-muted-foreground text-xs ml-1">({singleDmgRoll.rolls.join(', ')})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── Healing ── */}
          {spell.healDice && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Healing</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">{spell.healDice}</span>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5"
                    onClick={() => setSingleHealRoll(rollDice(spell.healDice!))}>
                    <Dices className="h-3.5 w-3.5" /> Roll
                  </Button>
                  {singleHealRoll && (
                    <div className="text-sm">
                      <span className="font-bold text-lg">{singleHealRoll.total}</span>
                      {singleHealRoll.rolls.length > 1 && (
                        <span className="text-muted-foreground text-xs ml-1">({singleHealRoll.rolls.join(', ')})</span>
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
          Confirm Cast{!isCantrip && ` (${LEVEL_LABELS[selectedSlot]})`}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
