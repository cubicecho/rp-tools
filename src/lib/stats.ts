import type { AbilityScores } from '@/types';

export const ABILITY_LABELS: Record<keyof AbilityScores, string> = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
};

export const SPELLCASTING_ABILITY: Record<string, keyof AbilityScores> = {
  wizard: 'int',
  cleric: 'wis',
  druid: 'wis',
  ranger: 'wis',
  bard: 'cha',
  paladin: 'cha',
  sorcerer: 'cha',
  warlock: 'cha',
};

export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function proficiencyBonus(level: number): number {
  return Math.floor((level - 1) / 4) + 2;
}

export function spellcastingKey(classId: string): keyof AbilityScores {
  return SPELLCASTING_ABILITY[classId] ?? 'int';
}

export function spellSaveDC(level: number, classId: string, stats: AbilityScores): number {
  const mod = abilityMod(stats[spellcastingKey(classId)]);
  return 8 + proficiencyBonus(level) + mod;
}

export function spellAttackBonus(level: number, classId: string, stats: AbilityScores): number {
  const mod = abilityMod(stats[spellcastingKey(classId)]);
  return proficiencyBonus(level) + mod;
}

export interface DiceResult {
  expression: string;
  rolls: number[];
  total: number;
}

export function rollDice(expression: string): DiceResult {
  const match = expression.match(/^(\d+)d(\d+)$/);
  if (!match) return { expression, rolls: [], total: 0 };
  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  return { expression, rolls, total: rolls.reduce((a, b) => a + b, 0) };
}

export function upcastDice(base: string, extra: string, slotsAbove: number): string {
  const bm = base.match(/^(\d+)d(\d+)$/);
  const em = extra.match(/^(\d+)d(\d+)$/);
  if (!bm || !em || bm[2] !== em[2]) return base;
  return `${parseInt(bm[1]) + parseInt(em[1]) * slotsAbove}d${bm[2]}`;
}
