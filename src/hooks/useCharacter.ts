import { useState, useEffect, useCallback } from 'react';
import type { Character, ClassData, Edition, AbilityScores } from '@/types';
import { buildCharacter, updateSlots, shortRest, longRest, useSlot, usePactSlot, getMaxSlots, getMaxPactSlots } from '@/lib/spellSlots';

const STORAGE_KEY = 'rp-tools-character';

const DEFAULT_CHARACTER: Character = {
  classId: '',
  level: 1,
  edition: '5.5e',
  knownSpells: [],
  currentSlots: [],
  currentPactSlots: 0,
  stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
};

export function useCharacter(classes: ClassData[]) {
  const [character, setCharacterRaw] = useState<Character>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : DEFAULT_CHARACTER;
      // Migrate old saves that lack stats
      if (!parsed.stats) parsed.stats = DEFAULT_CHARACTER.stats;
      return parsed;
    } catch {
      return DEFAULT_CHARACTER;
    }
  });

  const setCharacter = useCallback((next: Character | ((prev: Character) => Character)) => {
    setCharacterRaw(prev => {
      const updated = typeof next === 'function' ? next(prev) : next;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(character));
  }, [character]);

  const currentClass = classes.find(c => c.id === character.classId);

  const setClass = useCallback((classId: string, edition: Edition) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;
    setCharacter(prev => buildCharacter(classId, prev.level, edition, cls, prev.stats));
  }, [classes, setCharacter]);

  const setLevel = useCallback((level: number) => {
    if (!currentClass) {
      setCharacter(prev => ({ ...prev, level }));
      return;
    }
    setCharacter(prev => ({
      ...prev,
      level,
      currentSlots: getMaxSlots(currentClass, level),
      currentPactSlots: getMaxPactSlots(currentClass, level),
    }));
  }, [currentClass, setCharacter]);

  const updateStats = useCallback((patch: Partial<AbilityScores>) => {
    setCharacter(prev => ({ ...prev, stats: { ...prev.stats, ...patch } }));
  }, [setCharacter]);

  const addSpell = useCallback((spellId: string) => {
    setCharacter(prev => {
      if (prev.knownSpells.some(s => s.spellId === spellId)) return prev;
      return { ...prev, knownSpells: [...prev.knownSpells, { spellId, prepared: false }] };
    });
  }, [setCharacter]);

  const removeSpell = useCallback((spellId: string) => {
    setCharacter(prev => ({
      ...prev,
      knownSpells: prev.knownSpells.filter(s => s.spellId !== spellId),
    }));
  }, [setCharacter]);

  const togglePrepared = useCallback((spellId: string) => {
    setCharacter(prev => ({
      ...prev,
      knownSpells: prev.knownSpells.map(s =>
        s.spellId === spellId ? { ...s, prepared: !s.prepared } : s
      ),
    }));
  }, [setCharacter]);

  const castSpell = useCallback((slotLevel: number) => {
    if (!currentClass) return;
    if (currentClass.spellcastingType === 'pact') {
      setCharacter(prev => usePactSlot(prev));
    } else {
      setCharacter(prev => useSlot(prev, slotLevel));
    }
  }, [currentClass, setCharacter]);

  const doShortRest = useCallback(() => {
    if (!currentClass) return;
    setCharacter(prev => shortRest(prev, currentClass));
  }, [currentClass, setCharacter]);

  const doLongRest = useCallback(() => {
    if (!currentClass) return;
    setCharacter(prev => longRest(prev, currentClass));
  }, [currentClass, setCharacter]);

  const refreshSlots = useCallback(() => {
    if (!currentClass) return;
    setCharacter(prev => updateSlots(prev, currentClass));
  }, [currentClass, setCharacter]);

  return {
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
    refreshSlots,
  };
}
