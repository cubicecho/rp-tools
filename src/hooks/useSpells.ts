import { useState, useEffect, useMemo } from 'react';
import type { Spell, Edition } from '@/types';

export function useSpells(edition: Edition) {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const base = import.meta.env.BASE_URL;
    const file = edition === '5.5e' ? `${base}data/spells-5.5e.json` : `${base}data/spells-5e.json`;
    fetch(file)
      .then(r => r.json())
      .then(data => { setSpells(data.spells); setLoading(false); })
      .catch(() => setLoading(false));
  }, [edition]);

  const byId = useMemo(() => {
    const map = new Map<string, Spell>();
    spells.forEach(s => map.set(s.id, s));
    return map;
  }, [spells]);

  return { spells, loading, byId };
}
