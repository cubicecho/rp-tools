import { readFileSync, writeFileSync } from 'fs';

const ABILITIES = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
const DAMAGE_TYPES = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning',
                      'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'];
const PROJECTILE_WORDS = ['dart', 'ray', 'missile', 'bolt', 'beam', 'shard'];
const NUMBER_WORDS = { one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10 };

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }

function detectMultiHit(desc) {
  const projPat = PROJECTILE_WORDS.join('|');

  // "three glowing darts", "three fiery rays", "two beams" etc.
  const countRx = new RegExp(
    `(one|two|three|four|five|six|seven|eight|nine|ten)\\s+(?:\\w+\\s+){0,2}(${projPat})s?\\b`, 'i'
  );
  const countMatch = desc.match(countRx);
  if (!countMatch) return { hitCount: null, attackPerHit: false, hitsScaleWithLevel: false };

  const hitCount = NUMBER_WORDS[countMatch[1].toLowerCase()];

  // "Make a ... attack for each ray/dart/beam"
  const attackPerHit = new RegExp(
    `make\\s+a[n]?\\s+(?:\\w+\\s+){0,4}attack\\s+for\\s+each(?:\\s+(?:${projPat}))?`, 'i'
  ).test(desc);

  // "one more dart/ray for each slot level" or "one additional ray for each"
  const hitsScaleWithLevel = new RegExp(
    `one\\s+(?:more|additional)\\s+(?:\\w+\\s+){0,2}(?:${projPat}|hit|attack)\\s+for\\s+each`, 'i'
  ).test(desc);

  return { hitCount, attackPerHit, hitsScaleWithLevel };
}

function parseSpellMechanics(spell) {
  const desc = spell.description ?? '';

  // --- Multi-hit detection (run first so we can use it in classification) ---
  const { hitCount, attackPerHit, hitsScaleWithLevel } = detectMultiHit(desc);

  // --- Attack type ---
  let attackType = null;
  if (/melee\s+spell\s+attack/i.test(desc)) {
    attackType = 'melee';
  } else if (/ranged\s+spell\s+attack/i.test(desc)) {
    attackType = 'ranged';
  }
  // Multi-hit attack spells may not repeat "ranged/melee" near "each"
  if (!attackType && attackPerHit) attackType = 'ranged';

  // --- Saving throw (first mention wins) ---
  let saveAbility = null;
  const saveRx = new RegExp(`(${ABILITIES.join('|')})\\s+saving\\s+throw`, 'i');
  const saveMatch = desc.match(saveRx);
  if (saveMatch) saveAbility = cap(saveMatch[1]);

  // --- Primary damage dice ---
  // For multi-hit spells, find per-hit dice (near projectile word or "each")
  let damageDice = null;
  let damageType = null;

  if (hitCount) {
    // Per-hit dice: "A dart deals 1d4", "each ray deals 2d6 fire damage", "target takes 2d6 fire"
    const projPat = PROJECTILE_WORDS.join('|');
    const perHitRx = new RegExp(
      `(?:${projPat}|each|target|on a hit)\\s+(?:[^.]{0,40}?)(\\d+d\\d+)(?:[^.]{0,30}?)(?:(${DAMAGE_TYPES.join('|')})\\s+damage)?`, 'i'
    );
    const perHitMatch = desc.match(perHitRx);
    if (perHitMatch) {
      damageDice = perHitMatch[1];
      if (perHitMatch[2]) damageType = perHitMatch[2].toLowerCase();
    }
  }

  if (!damageDice) {
    const typedDmgRx = new RegExp(
      `(\\d+d\\d+)(?:[^.]{0,30}?)\\s+(${DAMAGE_TYPES.join('|')})\\s+damage`, 'i'
    );
    const typedDmgMatch = desc.match(typedDmgRx);
    if (typedDmgMatch) {
      damageDice = typedDmgMatch[1];
      damageType = typedDmgMatch[2].toLowerCase();
    }
  }

  if (!damageDice) {
    const anyDmgMatch = desc.match(/(\d+d\d+)\s+damage/i);
    if (anyDmgMatch) damageDice = anyDmgMatch[1];
  }

  // --- Healing dice ---
  let healDice = null;
  const healMatch =
    desc.match(/(?:regain|restore|heal)[s]?\s+(?:\w+\s+){0,5}?(\d+d\d+)(?:[^.]{0,20}?)\s+(?:hit\s+points?|hp)/i) ||
    desc.match(/(?:hit\s+points?|hp)\s+equal\s+to\s+(\d+d\d+)/i) ||
    desc.match(/(\d+d\d+)\s+(?:hit\s+points?|hp)/i);
  if (healMatch) healDice = healMatch[1];

  // --- Higher-level scaling dice ---
  // For multi-hit spells "one more ray" → higherLevelDice = damageDice (one extra hit's worth)
  // For single-hit spells "increases by 1d6" → the extra dice
  let higherLevelDice = null;
  if (hitCount && hitsScaleWithLevel && damageDice) {
    higherLevelDice = damageDice; // one more hit = one more set of per-hit dice
  } else {
    const higherMatch = desc.match(
      /(?:increases?\s+by|an\s+additional|one\s+more)\s+(\d+d\d+)/i
    );
    if (higherMatch) higherLevelDice = higherMatch[1];
  }

  // --- Classify primary mechanic ---
  let spellMechanic;
  if (attackType || attackPerHit) {
    spellMechanic = 'attack';
  } else if (saveAbility) {
    spellMechanic = 'save';
  } else if (healDice && !damageDice) {
    spellMechanic = 'healing';
  } else if (damageDice) {
    spellMechanic = 'damage';
  } else {
    spellMechanic = 'utility';
  }

  return {
    spellMechanic, attackType, saveAbility,
    damageDice, damageType, healDice, higherLevelDice,
    hitCount, attackPerHit, hitsScaleWithLevel,
  };
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
