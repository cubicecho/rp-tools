export type Edition = '5.5e' | '5e';
export type SpellLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type SpellMechanic = 'attack' | 'save' | 'healing' | 'damage' | 'utility';

export interface Spell {
  id: string;
  name: string;
  level: SpellLevel;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  classes: string[];
  source: string;
  // Parsed mechanics
  spellMechanic: SpellMechanic;
  attackType: 'melee' | 'ranged' | null;
  saveAbility: string | null;
  damageDice: string | null;      // per-hit dice
  damageType: string | null;
  healDice: string | null;
  higherLevelDice: string | null; // extra per-hit dice or extra hit dice per slot level
  hitCount: number | null;        // null / 1 = single hit
  attackPerHit: boolean;          // each hit needs its own attack roll (e.g. Scorching Ray)
  hitsScaleWithLevel: boolean;    // +1 hit per slot level above base
  cantripScaling: boolean;        // damage dice multiply at levels 5, 11, 17
}

export interface ClassData {
  id: string;
  name: string;
  edition: Edition;
  spellcastingAbility: string;
  spellcastingType: 'full' | 'half' | 'pact';
  restType: 'long' | 'short';
  spellSlots: number[][];
  pactSlots?: { slots: number; level: number }[];
}

export interface KnownSpell {
  spellId: string;
  prepared: boolean;
}

export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface Character {
  classId: string;
  level: number;
  edition: Edition;
  knownSpells: KnownSpell[];
  currentSlots: number[];
  currentPactSlots: number;
  stats: AbilityScores;
}
