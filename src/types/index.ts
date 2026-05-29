export type Edition = '5.5e' | '5e';
export type SpellLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

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

export interface Character {
  classId: string;
  level: number;
  edition: Edition;
  knownSpells: KnownSpell[];
  currentSlots: number[];
  currentPactSlots: number;
}
