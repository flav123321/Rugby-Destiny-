import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EVENTS } from '../src/data/events.js';
import { drawEvent, applyChoice } from '../src/engine/events.js';
import { newCareer, advance, choose } from '../src/engine/career.js';
import { createRng } from '../src/engine/rng.js';
import { STAT_KEYS } from '../src/data/positions.js';

const input = { prenom: 'Léo', nom: 'Martin', nationaliteId: 'FR', positionId: 'centre', tailleCm: 185, poidsKg: 95,
  personnaliteIds: ['bosseur', 'calme', 'fidele'], paysCentreId: 'FR', clubId: 'toulouse' };

test('au moins 100 événements, dont 45 au centre et 40 en pro, beaucoup avec 3 ou 4 choix', () => {
  assert.ok(EVENTS.length >= 100, `${EVENTS.length}`);
  assert.ok(EVENTS.filter(e => e.phase === 'centre').length >= 45);
  assert.ok(EVENTS.filter(e => e.phase === 'pro').length >= 40);
  assert.ok(EVENTS.filter(e => e.choix.length >= 3).length >= 50);
  assert.equal(new Set(EVENTS.map(e => e.id)).size, EVENTS.length);
});

test('un événement vu ne revient pas pendant 2 saisons', () => {
  const player = { age: 17, positionId: 'centre', personnaliteIds: ['bosseur', 'calme', 'fidele'], stats: Object.fromEntries(STAT_KEYS.map(k => [k, 50])),
    potentiel: 80, moral: 70, forme: 70, blessure: null, nationaliteId: 'FR' };
  let s = { phase: 'centre', annee: 2027, flags: [], vusSaison: [], vus: {}, journal: [], player };
  const rng = createRng(4);
  const e = drawEvent(s, 'automne', rng);
  s = applyChoice(s, e, 0);
  for (const annee of [2027, 2028]) for (let i = 0; i < 200; i++)
    assert.notEqual(drawEvent({ ...s, annee, vusSaison: [] }, 'automne', rng)?.id, e.id);
});

test('au centre, chaque match joué est listé avec un adversaire et ta perf', () => {
  let s = newCareer(input, 9); let g = 0;
  while (s.periodeIndex < 2 && g++ < 20) { if (s.evenementEnCours) s = choose(s, 0); else s = advance(s); }
  assert.ok(s.matchsJeunes?.length > 0, 'matchs listés');
  const m = s.matchsJeunes.at(-1);
  assert.ok(m.adversaire && m.score && m.categorie);
  assert.equal(s.matchsJeunes.length, Math.min(s.saisonStats.matchs, 12));
});
