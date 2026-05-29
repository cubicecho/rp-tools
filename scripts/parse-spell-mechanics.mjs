import { readFileSync, writeFileSync } from 'fs';

const ABILITIES = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
const DAMAGE_TYPES = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning',
                      'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'];

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }

function parseSpellMechanics(spell) {
  const desc = spell.description ?? '';

  // --- Attack type ---
  let attackType = null;
  if (/melee\s+spell\s+attack/i.test(desc)) {
    attackType = 'melee';
  } else if (/ranged\s+spell\s+attack/i.test(desc)) {
    attackType = 'ranged';
  }

  // --- Saving throw (first mention wins) ---
  let saveAbility = null;
  const saveRx = new RegExp(`(${ABILITIES.join('|')})\\s+saving\\s+throw`, 'i');
  const saveMatch = desc.match(saveRx);
  if (saveMatch) saveAbility = cap(saveMatch[1]);

  // --- Primary damage dice ---
  // Try typed first: "8d6 fire damage" or "2d10 lightning damage"
  let damageDice = null;
  let damageType = null;
  const typedDmgRx = new RegExp(
    `(\\d+d\\d+)(?:[^.]{0,30}?)\\s+(${DAMAGE_TYPES.join('|')})\\s+damage`, 'i'
  );
  const typedDmgMatch = desc.match(typedDmgRx);
  if (typedDmgMatch) {
    damageDice = typedDmgMatch[1];
    damageType = typedDmgMatch[2].toLowerCase();
  }

  // Fallback: any "Xd# damage" with no type annotation
  if (!damageDice) {
    const anyDmgMatch = desc.match(/(\d+d\d+)\s+damage/i);
    if (anyDmgMatch) damageDice = anyDmgMatch[1];
  }

  // --- Healing dice ---
  // "regains 2d8 hit points" OR "Hit Points equal to 2d8" OR "restore 4d8 + 15 hit points"
  let healDice = null;
  const healMatch =
    desc.match(/(?:regain|restore|heal)[s]?\s+(?:\w+\s+){0,5}?(\d+d\d+)(?:[^.]{0,20}?)\s+(?:hit\s+points?|hp)/i) ||
    desc.match(/(?:hit\s+points?|hp)\s+equal\s+to\s+(\d+d\d+)/i) ||
    desc.match(/(\d+d\d+)\s+(?:hit\s+points?|hp)/i);
  if (healMatch) healDice = healMatch[1];

  // --- Higher-level scaling dice ---
  let higherLevelDice = null;
  const higherMatch = desc.match(
    /(?:increases?\s+by|an\s+additional|one\s+more)\s+(\d+d\d+)/i
  );
  if (higherMatch) higherLevelDice = higherMatch[1];

  // --- Classify primary mechanic ---
  // Priority: attack > save > healing > damage (auto-hit) > utility
  let spellMechanic;
  if (attackType) {
    spellMechanic = 'attack';
  } else if (saveAbility) {
    spellMechanic = 'save';
  } else if (healDice && !damageDice) {
    spellMechanic = 'healing';
  } else if (damageDice) {
    spellMechanic = 'damage'; // auto-hit like Magic Missile
  } else {
    spellMechanic = 'utility';
  }

  return { spellMechanic, attackType, saveAbility, damageDice, damageType, healDice, higherLevelDice };
}

const raw = readFileSync('public/data/spells-5.5e.json', 'utf8');
const data = JSON.parse(raw);

const counts = { attack: 0, save: 0, healing: 0, damage: 0, utility: 0 };

data.spells = data.spells.map(spell => {
  const mechanics = parseSpellMechanics(spell);
  counts[mechanics.spellMechanic]++;
  return { ...spell, ...mechanics };
});

writeFileSync('public/data/spells-5.5e.json', JSON.stringify(data));

console.log(`Updated ${data.spells.length} spells:`);
for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}`);
