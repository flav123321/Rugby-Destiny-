import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newCareer, advance, choose, acceptOffer, seasonSummary } from '../src/engine/career.js';

const input = { prenom: 'Léo', nom: 'Martin', nationaliteId: 'FR', positionId: 'centre', tailleCm: 185, poidsKg: 95,
  personnaliteIds: ['bosseur', 'calme', 'fidele'], paysCentreId: 'FR', clubId: 'toulouse' };

function premiereSaisonPro(seed) {
  let s = newCareer(input, seed); let g = 0;
  while (g++ < 300) {
    if (s.phase === 'offres') { s = acceptOffer(s, 0); break; }
    if (s.evenementEnCours && s.phase !== 'bilan') { s = choose(s, 0); continue; }
    s = advance(s);
  }
  // joue toute la première saison pro jusqu'avant le bilan
  while (s.periode !== 'ete' && g++ < 400) {
    if (s.evenementEnCours) { s = choose(s, 0); continue; }
    s = advance(s);
  }
  return s;
}

test('un espoir non retenu en Top 14 joue avec les Espoirs, et ses stats sont comptées à part', () => {
  const s = premiereSaisonPro(5);
  const st = s.saisonStats;
  assert.ok(st.espoirs, 'stats Espoirs présentes');
  assert.ok(st.espoirs.matchs >= 10, `Espoirs : ${st.espoirs.matchs} matchs`);
  assert.ok(st.espoirs.minutes > 0 && st.espoirs.notes.length > 0);
  const r = seasonSummary(s);
  assert.equal(r.espoirs.matchs, st.espoirs.matchs);
  assert.ok(r.espoirs.noteMoyenne !== null);
});
