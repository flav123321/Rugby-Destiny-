import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEAGUES, clubById, leagueOfClub } from '../src/data/leagues/index.js';
import { POSITIONS, STAT_KEYS } from '../src/data/positions.js';
import { newCareer, advance, choose, acceptOffer, contractOffers } from '../src/engine/career.js';
import { nationalPool } from '../src/engine/international.js';
import { createRng } from '../src/engine/rng.js';

const stats = (v) => Object.fromEntries(STAT_KEYS.map(k => [k, v]));
const input = { prenom: 'A', nom: 'B', nationaliteId: 'FR', positionId: 'centre', tailleCm: 185, poidsKg: 95,
  personnaliteIds: ['bosseur', 'calme', 'fidele'], paysCentreId: 'FR' };

test('Pro D2 (16 clubs) et Nationale (14 clubs), effectifs complets', () => {
  const [t14, pd2, nat] = LEAGUES;
  assert.equal(t14.id, 'top14'); assert.equal(pd2.clubs.length, 16); assert.equal(nat.clubs.length, 14);
  for (const l of [pd2, nat]) for (const c of l.clubs) {
    for (const p of POSITIONS) assert.ok(c.joueurs.filter(j => j.positionId === p.id).length >= 2, `${c.id} ${p.id}`);
    assert.match(c.couleurs[0], /^#[0-9a-f]{6}$/i);
  }
  assert.equal(new Set(LEAGUES.flatMap(l => l.clubs.map(c => c.id))).size, 44);
  assert.equal(leagueOfClub('oyonnax').id, 'prod2');
  assert.ok(clubById('oyonnax').joueurs.some(j => j.nom === 'Vasil Lobzhanidze'));
});

test('les vrais joueurs de Pro D2 comptent pour leur sélection', () => {
  assert.ok(nationalPool('GE').some(j => j.nom === 'Luka Nioradze'));
});

function saisonComplete(s) {
  let g = 0; const a0 = s.annee;
  while (s.annee === a0 && g++ < 200) { if (s.evenementEnCours && s.phase !== 'bilan') s = choose(s, 0); else s = advance(s); }
  return s;
}

test('une saison en Pro D2 : 30 journées, classement à 16, bilan au bon niveau', () => {
  let s = newCareer({ ...input, clubId: 'toulouse' }, 3);
  s = { ...s, phase: 'pro', periodeIndex: -1, contratFin: 2030, player: { ...s.player, age: 20, clubId: 'grenoble', stats: stats(70) }, saisonStats: { matchs: 0, titularisations: 0, minutes: 0, essais: 0, points: 0, plaquages: 0, notes: [] } };
  let g = 0;
  while (s.periode !== 'ete' && g++ < 50) { if (s.evenementEnCours) s = choose(s, 0); else s = advance(s); }
  assert.equal(s.ligue.leagueId, 'prod2');
  assert.equal(s.ligue.journee, 30);
  assert.ok(s.saisonStats.matchs > 10);
  s = saisonComplete(s);
  assert.equal(s.dernierResume.niveau, 'Pro D2');
  assert.equal(s.dernierResume.tableau.length, 16);
});

test('un prêt envoie le joueur dans un vrai club, puis il revient', () => {
  let s = newCareer({ ...input, clubId: 'toulouse' }, 4);
  s = { ...s, phase: 'offres', offresContrat: [{ type: 'pret', clubId: 'toulouse', duree: 1, division: 'Pro D2', role: 'rotation' }] };
  s = acceptOffer(s, 0);
  assert.equal(leagueOfClub(s.player.clubId).id, 'prod2');
  assert.equal(s.pret.clubParent, 'toulouse');
  s = saisonComplete(s);
  assert.equal(s.phase, 'offres');
  assert.ok(s.offresContrat.some(o => o.clubId === 'toulouse'), 'le club formateur fait une offre au retour');
});

test('offres adaptées au niveau : un joueur moyen reçoit des offres de Pro D2 ou de Nationale, jamais une fin de carrière', () => {
  const rng = createRng(5);
  for (const v of [45, 55, 62]) {
    const s = { ...newCareer({ ...input, clubId: 'toulouse' }, 5), annee: 2028 };
    const offres = contractOffers({ ...s, player: { ...s.player, age: 22, stats: stats(v) } }, rng);
    assert.ok(offres.some(o => o.type === 'pro' && ['prod2', 'nationale'].includes(leagueOfClub(o.clubId).id)), `note ${v}`);
    assert.ok(!offres.some(o => o.type === 'liberation'), `note ${v}`);
  }
});
