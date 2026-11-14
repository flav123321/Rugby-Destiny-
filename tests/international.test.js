import { test } from 'node:test';
import assert from 'node:assert/strict';
import { windowFor, nationalPool, nationStrength, selectNational, playWindow } from '../src/engine/international.js';
import { NATIONALITIES } from '../src/data/nationalities.js';
import { POSITIONS, STAT_KEYS } from '../src/data/positions.js';
import { createRng } from '../src/engine/rng.js';
import { newCareer, advance, choose, acceptOffer } from '../src/engine/career.js';

const stats = (v) => Object.fromEntries(STAT_KEYS.map(k => [k, v]));
const joueur = (o = {}) => ({ prenom: 'A', nom: 'B', age: 24, nationaliteId: 'FR', positionId: 'ailier', personnaliteIds: ['calme', 'fidele', 'studieux'],
  stats: stats(60), potentiel: 90, moral: 70, forme: 70, blessure: null, clubId: 'toulouse', historique: [], ...o });

test('calendrier : Nations Championship 2026, Coupe du monde 2027, Six Nations chaque hiver', () => {
  assert.equal(windowFor(2026, 'automne', 'FR').competition, 'Nations Championship');
  assert.equal(windowFor(2026, 'automne', 'PT').competition, 'Nations Cup');
  assert.equal(windowFor(2027, 'automne', 'NZ').competition, 'Coupe du monde');
  assert.equal(windowFor(2026, 'hiver', 'FR').competition, 'Tournoi des Six Nations');
  assert.equal(windowFor(2026, 'hiver', 'NZ'), null);
  assert.equal(windowFor(2027, 'ete', 'FR').competition, 'Nations Championship'); // juillet 2028
  assert.equal(windowFor(2026, 'ete', 'FR').competition, 'Tests d’été'); // juillet 2027, année de Coupe du monde
  assert.equal(windowFor(2026, 'printemps', 'FR'), null);
  assert.equal(windowFor(2031, 'automne', 'FR').competition, 'Coupe du monde');
});

test('chaque sélection a un effectif complet avec de vrais joueurs', () => {
  for (const n of NATIONALITIES) {
    const pool = nationalPool(n.id);
    assert.ok(pool.length >= 30, `${n.id} ${pool.length}`);
    for (const p of POSITIONS) assert.ok(pool.filter(j => j.positionId === p.id).length >= (p.numeros.length + 1), `${n.id} ${p.id}`);
  }
  assert.ok(nationalPool('FR').some(j => j.nom === 'Antoine Dupont'));
  assert.ok(nationalPool('NZ').some(j => j.nom === 'Ardie Savea'));
});

test('hiérarchie des nations cohérente', () => {
  assert.ok(nationStrength('ZA') > nationStrength('IT'));
  assert.ok(nationStrength('IT') > nationStrength('PT'));
  assert.ok(nationStrength('PT') > nationStrength('UY') - 3);
});

test('un monstre est sélectionné, un joueur moyen non', () => {
  const rng = createRng(1);
  let oui = 0, non = 0;
  for (let i = 0; i < 100; i++) {
    if (selectNational(joueur({ stats: stats(96) }), rng) !== 'non-retenu') oui++;
    if (selectNational(joueur({ stats: stats(62) }), rng) !== 'non-retenu') non++;
  }
  assert.ok(oui > 85, `${oui}`); assert.equal(non, 0);
  assert.equal(selectNational(joueur({ stats: stats(96), age: 17 }), rng), 'non-retenu'); // trop jeune pour les A
});

test('fenêtre jouée : matchs, perf et résultat de la compétition', () => {
  const w = playWindow(joueur({ stats: stats(96) }), 2026, 'hiver', createRng(3));
  assert.equal(w.competition, 'Tournoi des Six Nations');
  assert.equal(w.matchs.length, 5);
  assert.ok(w.matchs.some(m => m.perf));
  assert.ok(w.resultat);
  assert.ok(w.absencesClub >= 2);
});

test('U20 : un jeune de 18 ans au bon niveau joue avec les moins de 20 ans', () => {
  const w = playWindow(joueur({ age: 18, stats: stats(70) }), 2026, 'hiver', createRng(4));
  assert.equal(w.competition, 'Six Nations U20');
  assert.ok(w.matchs.length === 5 && w.matchs.some(m => m.perf));
});

test('en carrière, un monstre français cumule des sélections', () => {
  let s = newCareer({ prenom: 'A', nom: 'B', nationaliteId: 'FR', positionId: 'ailier', tailleCm: 185, poidsKg: 90,
    personnaliteIds: ['bosseur', 'flair', 'calme'], paysCentreId: 'FR', clubId: 'toulouse' }, 2);
  s = { ...s, player: { ...s.player, stats: stats(97), potentiel: 99 } };
  let g = 0;
  while (s.player.age < 22 && g++ < 2000) {
    if (s.phase === 'bilan') { s = advance(s); continue; }
    if (s.evenementEnCours) { s = choose(s, 0); continue; }
    if (s.phase === 'offres') { s = acceptOffer(s, 0); continue; }
    s = advance(s);
  }
  assert.ok(s.player.selections > 5, `${s.player.selections} sélections`);
  assert.ok(s.player.historique.some(h => h.inter?.matchs > 0));
});
