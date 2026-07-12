import { useState } from 'react'
import { Star, Zap, Trash2, Info, Clock, MapPin, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card'
import { Separator } from '@/components/ui/separator'
import { SpellDetail } from '@/components/SpellDetail'
import { CastRoller } from '@/components/CastRoller'
import { SCHOOL_COLORS, LEVEL_LABELS, cn } from '@/lib/utils'
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
  const [descExpanded, setDescExpanded] = useState(false)
  const [hoverOpen, setHoverOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const schoolColor = SCHOOL_COLORS[spell.school] ?? 'bg-gray-100 text-gray-800 border-gray-300'
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

  return (
    <>
      {variant === 'compact' ? (
        <Card className={cn('transition-colors', prepared && 'border-primary/40')}>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge className={`border text-xs shrink-0 ${schoolColor}`}>
                    {LEVEL_LABELS[spell.level]}
                  </Badge>
                  <span className="font-medium text-sm leading-tight">{spell.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{spell.school} · {spell.castingTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={onDetail} title="Details">
                <Info className="h-3.5 w-3.5" />
              </Button>
              {!isCantrip && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('h-7 w-7 p-0 shrink-0', prepared && 'text-primary')}
                  onClick={onTogglePrepared}
                  title={prepared ? 'Unprepare' : 'Prepare'}
                >
                  <Star className={cn('h-3.5 w-3.5', prepared && 'fill-current')} />
                </Button>
              )}
              <Button
                variant={canCast ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-2 text-xs flex-1"
                disabled={!canCast}
                onClick={handleCastClick}
              >
                <Zap className="h-3 w-3 mr-1" />
                {canCast ? 'Cast' : 'No slots'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={onRemove}
                title="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Detailed variant — play view */
        <Card className={cn('transition-colors flex flex-col', prepared && 'border-primary/40')}>
          <CardContent className="p-4 flex flex-col gap-3 flex-1">
            {/* Name + badges */}
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm leading-tight flex-1">{spell.name}</h3>
                {!isCantrip && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn('h-6 w-6 p-0 shrink-0 -mt-0.5', prepared && 'text-primary')}
                    onClick={onTogglePrepared}
                    title={prepared ? 'Unprepare' : 'Prepare'}
                  >
                    <Star className={cn('h-3.5 w-3.5', prepared && 'fill-current')} />
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge className={`border text-xs ${schoolColor}`}>{LEVEL_LABELS[spell.level]}</Badge>
                <Badge variant="outline" className="text-xs">{spell.school}</Badge>
                {spell.concentration && <Badge variant="secondary" className="text-xs">Concentration</Badge>}
                {spell.ritual && <Badge variant="secondary" className="text-xs">Ritual</Badge>}
              </div>
            </div>

            <Separator />

            {/* Spell details */}
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground flex-wrap">
                <Clock className="h-3 w-3 shrink-0" />
                <span className="text-foreground">{spell.castingTime}</span>
                {spell.ritual && (
                  <span className="text-amber-400/90 italic">· ritual: no slot, +10 min</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Timer className="h-3 w-3 shrink-0" />
                <span className="text-foreground">{spell.duration}</span>
                <span>·</span>
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="text-foreground">{spell.range}</span>
              </div>
              <div className="text-xs text-muted-foreground/70 truncate" title={spell.components}>
                {spell.components}
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-1">
              {descExpanded && (
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {spell.description}
                </p>
              )}
              <button
                className="text-xs text-primary/70 hover:text-primary"
                onClick={() => setDescExpanded(e => !e)}
              >
                {descExpanded ? 'Hide description' : 'Show description'}
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 mt-auto pt-1">
              <Button
                variant={canCast ? 'default' : 'ghost'}
                size="sm"
                className="h-8 flex-1 text-xs"
                disabled={!canCast}
                onClick={handleCastClick}
              >
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                {canCast ? 'Cast' : 'No slots'}
              </Button>
              <HoverCard open={hoverOpen} onOpenChange={setHoverOpen} openDelay={200} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Spell details"
                    onClick={() => { setHoverOpen(false); setDetailOpen(true) }}
                  >
                    <Info className="h-3.5 w-3.5" />
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent side="top" align="end" className="w-[520px] max-h-[70vh] overflow-y-auto p-5 space-y-3">
                  {/* Header */}
                  <div className="space-y-2">
                    <div className="font-semibold text-base">{spell.name}</div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge className={`border text-sm ${schoolColor}`}>{LEVEL_LABELS[spell.level]}</Badge>
                      <Badge variant="outline" className="text-sm">{spell.school}</Badge>
                      {spell.concentration && <Badge variant="secondary" className="text-sm">Concentration</Badge>}
                      {spell.ritual && <Badge variant="secondary" className="text-sm">Ritual</Badge>}
                    </div>
                  </div>
                  <Separator />
                  {/* Stats */}
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground uppercase tracking-wide text-xs">Casting Time</dt>
                      <dd>{spell.castingTime}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground uppercase tracking-wide text-xs">Range</dt>
                      <dd>{spell.range}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground uppercase tracking-wide text-xs">Duration</dt>
                      <dd>{spell.duration}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground uppercase tracking-wide text-xs">Components</dt>
                      <dd className="truncate" title={spell.components}>{spell.components}</dd>
                    </div>
                  </dl>
                  <Separator />
                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {spell.description}
                  </p>
                  <div className="text-xs text-muted-foreground/60">
                    {spell.classes.join(', ')} · {spell.source}
                  </div>
                </HoverCardContent>
              </HoverCard>
              <SpellDetail spell={spell} open={detailOpen} onClose={() => setDetailOpen(false)} />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                onClick={onRemove}
                title="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
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
