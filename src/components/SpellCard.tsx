import { useState } from 'react'
import { MapPin, Star, Timer } from 'lucide-react'
import { CardLayout } from '@/components/card-layout'
import { Collapsible } from '@/components/collapsible'
import { ConfirmButton } from '@/components/confirm-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Info, Trash2, Zap } from '@/components/ui/icons'
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card'
import { Separator } from '@/components/ui/separator'
import { SpellDetail } from '@/components/SpellDetail'
import { SpellBadges, SpellFacts, schoolColor } from '@/components/SpellFacts'
import { CastRoller } from '@/components/CastRoller'
import { cn } from '@/lib/utils'
import { LEVEL_LABELS } from '@/lib/spell-labels'
import type { Spell } from '@/types'

interface SpellCardProps {
  spell: Spell
  prepared: boolean
  currentSlots: number[]
  currentPactSlots: number
  pactSlotLevel: number
  isPact: boolean
  spellSaveDC: number
  spellAttackBonus: number
  characterLevel: number
  variant?: 'compact' | 'detailed'
  onTogglePrepared: () => void
  onCast: (slotLevel: number) => void
  onRemove: () => void
  onDetail: () => void
}

export function SpellCard({
  spell,
  prepared,
  currentSlots,
  currentPactSlots,
  pactSlotLevel,
  isPact,
  spellSaveDC,
  spellAttackBonus,
  characterLevel,
  variant = 'compact',
  onTogglePrepared,
  onCast,
  onRemove,
  onDetail,
}: SpellCardProps) {
  const [castRollerOpen, setCastRollerOpen] = useState(false)
  const [hoverOpen, setHoverOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const isCantrip = spell.level === 0

  const availableSlots: number[] = isCantrip
    ? []
    : isPact
    ? currentPactSlots > 0 ? [pactSlotLevel] : []
    : currentSlots
        .map((count, idx) => ({ level: idx + 1, count }))
        .filter(s => s.level >= spell.level && s.count > 0)
        .map(s => s.level)

  const canCast = isCantrip || availableSlots.length > 0

  function handleCastClick() {
    setCastRollerOpen(true)
  }

  const prepareButton = isCantrip ? null : (
    <Button
      variant="outline"
      size="icon-xs"
      aria-label={prepared ? `Unprepare ${spell.name}` : `Prepare ${spell.name}`}
      className={cn(prepared && 'text-active')}
      iconSlot={<Star className={cn(prepared && 'fill-current')} />}
      onClick={onTogglePrepared}
    />
  )

  // Re-adding a spell is cheap, but a slip of the thumb on a phone shouldn't cost a search.
  const removeButton = (
    <ConfirmButton
      variant="outline"
      size="icon-xs"
      aria-label={`Remove ${spell.name}`}
      iconSlot={<Trash2 />}
      title={`Remove ${spell.name}?`}
      description="It leaves your spell book. You can add it again from the class spell list."
      confirmLabel="Remove"
      onConfirm={onRemove}
    />
  )

  return (
    <>
      {variant === 'compact' ? (
        <CardLayout
          className={cn(prepared && 'border-active')}
          title={spell.name}
          description={`${spell.school} · ${spell.castingTime}`}
          actionSlot={<Badge className={cn('border', schoolColor(spell))}>{LEVEL_LABELS[spell.level]}</Badge>}
          footerSlot={
            <Button
              variant="outline"
              size="xs"
              iconSlot={<Zap />}
              content={canCast ? 'Cast' : 'No slots'}
              disabled={!canCast}
              onClick={handleCastClick}
            />
          }
          footerActionsSlot={
            <>
              <Button variant="outline" size="icon-xs" aria-label={`${spell.name} details`} iconSlot={<Info />} onClick={onDetail} />
              {prepareButton}
              {removeButton}
            </>
          }
        />
      ) : (
        /* Detailed variant — play view */
        <CardLayout
          className={cn('h-full', prepared && 'border-active')}
          title={spell.name}
          actionSlot={prepareButton}
          contentSlot={
            <>
              <SpellBadges spell={spell} />
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-foreground/60 flex-wrap">
                  <Clock className="h-3 w-3 shrink-0" aria-label="Casting time" />
                  <span className="text-foreground">{spell.castingTime}</span>
                  {spell.ritual && <span className="text-warning italic">· ritual: no slot, +10 min</span>}
                </div>
                <div className="flex items-center gap-1.5 text-foreground/60">
                  <Timer className="h-3 w-3 shrink-0" aria-label="Duration" />
                  <span className="text-foreground">{spell.duration}</span>
                  <span aria-hidden>·</span>
                  <MapPin className="h-3 w-3 shrink-0" aria-label="Range" />
                  <span className="text-foreground">{spell.range}</span>
                </div>
                <div className="text-foreground/60 truncate" title={spell.components}>
                  {spell.components}
                </div>
              </div>
              <Collapsible
                title="Description"
                contentSlot={
                  <p className="text-xs text-foreground/60 leading-relaxed whitespace-pre-line">{spell.description}</p>
                }
              />
            </>
          }
          footerSlot={
            <Button
              size="sm"
              iconSlot={<Zap />}
              content={canCast ? 'Cast' : 'No slots'}
              disabled={!canCast}
              onClick={handleCastClick}
            />
          }
          footerActionsSlot={
            <>
              <HoverCard open={hoverOpen} onOpenChange={setHoverOpen} openDelay={200} closeDelay={100}>
                <HoverCardTrigger asChild>
                  {/* The hover card is the preview, so the button's own name tooltip would be a second one. */}
                  <Button
                    variant="outline"
                    size="icon-xs"
                    aria-label={`${spell.name} details`}
                    tooltip={false}
                    iconSlot={<Info />}
                    onClick={() => { setHoverOpen(false); setDetailOpen(true) }}
                  />
                </HoverCardTrigger>
                <HoverCardContent side="top" align="end" className="w-[520px] max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto p-5 space-y-3">
                  <div className="space-y-2">
                    <div className="font-semibold text-base">{spell.name}</div>
                    <SpellBadges spell={spell} />
                  </div>
                  <Separator />
                  <SpellFacts spell={spell} />
                  <Separator />
                  <p className="text-sm text-foreground/60 leading-relaxed whitespace-pre-line">{spell.description}</p>
                  <div className="text-xs text-foreground/60">
                    {spell.classes.join(', ')} · {spell.source}
                  </div>
                </HoverCardContent>
              </HoverCard>
              <SpellDetail spell={spell} open={detailOpen} onClose={() => setDetailOpen(false)} />
              {removeButton}
            </>
          }
        />
      )}

      <CastRoller
        spell={spell}
        open={castRollerOpen}
        availableSlots={availableSlots}
        isPact={isPact}
        pactSlotLevel={pactSlotLevel}
        spellSaveDC={spellSaveDC}
        spellAttackBonus={spellAttackBonus}
        characterLevel={characterLevel}
        onCast={onCast}
        onClose={() => setCastRollerOpen(false)}
      />
    </>
  )
}
