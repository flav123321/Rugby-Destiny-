import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer } from '../src/engine/player.js';
import { createRng } from '../src/engine/rng.js';
import { newCareer, advance, choose, acceptOffer } from '../src/engine/career.js';
import { academyStep, newAcademyState } from '../src/engine/academy.js';
import { overall } from '../src/engine/rating.js';
import { STAT_KEYS } from '../src/data/positions.js';

const input = { prenom: 'A', nom: 'B', nationaliteId: 'FR', positionId: 'ailier', tailleCm: 185, poidsKg: 90,
  personnaliteIds: ['bosseur', 'flair', 'calme'], paysCentreId: 'FR' };

test('environ 1 joueur sur 10 est une pépite (potentiel 94-99, précoce)', () => {
  let n = 0;
  for (let s = 0; s < 1000; s++) { const p = createPlayer(input, createRng(s)); if (p.pepite) { n++; assert.ok(p.potentiel >= 94); } }
  assert.ok(n >= 60 && n <= 150, `${n}/1000`);
});

test('un jeune très fort joue en Top 14 dès le centre de formation', () => {
  const rng = createRng(3);
  const p = { ...createPlayer(input, rng), age: 17, clubId: 'vannes', stats: Object.fromEntries(STAT_KEYS.map(k => [k, 80])) };
  let s = newAcademyState(p);
  for (let i = 0; i < 4; i++) { s = academyStep(s, rng); s.evenementEnCours = null; }
  assert.ok(s.saisonStats.top14?.matchs > 0, 'matchs de Top 14 au centre');
  assert.ok(s.matchsJeunes.some(m => m.categorie === 'Top 14'));
});

test('un crack signe pro dès 18 ans', () => {
  const rng = createRng(5);
  const p = { ...createPlayer(input, rng), age: 17, clubId: 'vannes', stats: Object.fromEntries(STAT_KEYS.map(k => [k, 82])) };
  let s = { ...newAcademyState(p), periodeIndex: 4 };
  s = academyStep(s, rng);
  assert.equal(s.player.age, 18);
  assert.ok(s.offresContrat?.some(o => o.type === 'pro'), 'contrat pro anticipé');
});

test('un monstre peut devenir meilleur joueur du monde', () => {
  let distinctions = 0, cracks = 0;
  for (let seed = 1; seed <= 120; seed++) {
    let s = newCareer({ ...input, clubId: 'toulouse' }, seed);
    if (!s.player.pepite) continue;
    cracks++;
    let g = 0, pic = 0;
    while (s.phase !== 'fin' && s.player.age < 27 && g++ < 3000) {
      if (s.phase === 'bilan') { s = advance(s); continue; }
      if (s.evenementEnCours) { s = choose(s, 0); continue; }
      if (s.phase === 'offres') { s = acceptOffer(s, 0); continue; }
      s = advance(s); pic = Math.max(pic, overall(s.player.stats, s.player.positionId));
    }
    distinctions += s.player.historique.filter(h => h.distinctions?.includes('Meilleur joueur du monde World Rugby')).length;
    assert.ok(pic >= 90, `pépite seed ${seed} plafonne à ${pic}`);
  }
  assert.ok(cracks >= 5, `${cracks} pépites`);
  assert.ok(distinctions >= 2, `${distinctions} titres mondiaux`);
});
