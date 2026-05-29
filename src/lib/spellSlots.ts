import type { ClassData, Character, Edition } from '@/types';

export function getMaxSlots(cls: ClassData, level: number): number[] {
  if (cls.spellcastingType === 'pact') return [];
  return [...(cls.spellSlots[level - 1] ?? [])];
}

export function getMaxPactSlots(cls: ClassData, level: number): number {
  return cls.pactSlots?.[level - 1]?.slots ?? 0;
}

export function getPactSlotLevel(cls: ClassData, level: number): number {
  return cls.pactSlots?.[level - 1]?.level ?? 0;
}

const DEFAULT_STATS = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

export function buildCharacter(classId: string, level: number, edition: Edition, cls: ClassData, prevStats?: Character['stats']): Character {
  return {
    classId,
    level,
    edition,
    knownSpells: [],
    currentSlots: getMaxSlots(cls, level),
    currentPactSlots: getMaxPactSlots(cls, level),
    stats: prevStats ?? DEFAULT_STATS,
  };
}

export function updateSlots(character: Character, cls: ClassData): Character {
  const maxSlots = getMaxSlots(cls, character.level);
  const maxPact = getMaxPactSlots(cls, character.level);
  return {
    ...character,
    currentSlots: maxSlots,
    currentPactSlots: maxPact,
  };
}

export function shortRest(character: Character, cls: ClassData): Character {
  if (cls.restType === 'short') {
    return { ...character, currentPactSlots: getMaxPactSlots(cls, character.level) };
  }
  return character;
}

export function longRest(character: Character, cls: ClassData): Character {
  return updateSlots(character, cls);
}

export function useSlot(character: Character, slotLevel: number): Character {
  const idx = slotLevel - 1;
  if (idx < 0 || idx >= character.currentSlots.length || character.currentSlots[idx] <= 0) {
    return character;
  }
  const newSlots = [...character.currentSlots];
  newSlots[idx]--;
  return { ...character, currentSlots: newSlots };
}

export function usePactSlot(character: Character): Character {
  if (character.currentPactSlots <= 0) return character;
  return { ...character, currentPactSlots: character.currentPactSlots - 1 };
}
