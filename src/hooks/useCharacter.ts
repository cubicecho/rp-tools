import { useState, useEffect, useCallback } from 'react';
import type { Character, ClassData, Edition } from '@/types';
import { buildCharacter, updateSlots, shortRest, longRest, useSlot, usePactSlot, getMaxSlots, getMaxPactSlots } from '@/lib/spellSlots';

const STORAGE_KEY = 'rp-tools-character';

const DEFAULT_CHARACTER: Character = {
  classId: '',
  level: 1,
  edition: '5.5e',
  knownSpells: [],
  currentSlots: [],
  currentPactSlots: 0,
};

export function useCharacter(classes: ClassData[]) {
  const [character, setCharacterRaw] = useState<Character>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_CHARACTER;
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
    setCharacter(prev => buildCharacter(classId, prev.level, edition, cls));
  }, [classes, setCharacter]);

  const setLevel = useCallback((level: number) => {
    if (!currentClass) {
      setCharacter(prev => ({ ...prev, level }));
      return;
    }
    setCharacter(prev => {
      const base = { ...prev, level };
      const maxSlots = getMaxSlots(currentClass, level);
      const maxPact = getMaxPactSlots(currentClass, level);
      return {
        ...base,
        currentSlots: maxSlots,
        currentPactSlots: maxPact,
      };
    });
  }, [currentClass, setCharacter]);

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
    addSpell,
    removeSpell,
    togglePrepared,
    castSpell,
    doShortRest,
    doLongRest,
    refreshSlots,
  };
}
