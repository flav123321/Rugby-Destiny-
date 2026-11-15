import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setMonde, mondeInitial, leagueOfClub, LEAGUES } from '../src/data/leagues/index.js';
import { evolveMonde } from '../src/engine/monde.js';
import { createRng } from '../src/engine/rng.js';
import { newCareer, advance, choose } from '../src/engine/career.js';
import { save, load } from '../src/engine/save.js';

test('une saison fait monter et descendre des clubs, les tailles restent 14/16/14', () => {
  const m0 = mondeInitial();
  const { monde, mouvements } = evolveMonde(m0, null, createRng(1));
  assert.deepEqual([monde.top14.length, monde.prod2.length, monde.nationale.length], [14, 16, 14]);
  const montes = monde.top14.filter(id => !m0.top14.includes(id));
  const descendus = m0.top14.filter(id => !monde.top14.includes(id));
  assert.ok(montes.length >= 1 && montes.length <= 2);
  assert.equal(montes.length, descendus.length);
  for (const id of montes) assert.ok(m0.prod2.includes(id));
  for (const id of descendus) assert.ok(monde.prod2.includes(id));
  assert.ok(monde.nationale.some(id => m0.prod2.includes(id)), 'un club de Pro D2 descend en Nationale');
  assert.ok(mouvements.length >= 4);
  setMonde(monde);
  assert.equal(leagueOfClub(montes[0]).id, 'top14');
  assert.equal(LEAGUES[0].clubs.length, 14);
  setMonde(null);
  assert.equal(leagueOfClub(montes[0]).id, 'prod2');
});

test('le monde évolue pendant la carrière, est sauvegardé, et le bilan annonce les mouvements', () => {
  let s = newCareer({ prenom: 'A', nom: 'B', nationaliteId: 'FR', positionId: 'centre', tailleCm: 185, poidsKg: 95,
    personnaliteIds: ['bosseur', 'calme', 'fidele'], paysCentreId: 'FR', clubId: 'toulouse' }, 8);
  assert.deepEqual(s.monde, mondeInitial());
  let g = 0;
  while (s.annee < 2027 && g++ < 100) { if (s.evenementEnCours && s.phase !== 'bilan') s = choose(s, 0); else s = advance(s); }
  assert.notDeepEqual(s.monde, mondeInitial());
  assert.ok(s.dernierResume.mouvements?.length > 0);
  const st = new Map(); const mem = { getItem: k => st.get(k) ?? null, setItem: (k, v) => st.set(k, v) };
  save(s, mem);
  assert.deepEqual(load(mem).monde, s.monde);
  setMonde(null);
});
