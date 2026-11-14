import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newCareer, advance, choose, acceptOffer } from '../src/engine/career.js';
import { overall } from '../src/engine/rating.js';

const POS = ['ailier', 'centre', 'pilier-droit', 'demi-d-ouverture', 'troisieme-ligne-aile', 'talonneur'];
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

test('un bon joueur est atteignable : progression médiane suffisante sur 60 carrières', () => {
  const a21 = [], a24 = [], pics = [];
  for (let seed = 1; seed <= 60; seed++) {
    let s = newCareer({ prenom: 'A', nom: 'B', nationaliteId: 'FR', positionId: POS[seed % 6], tailleCm: 185, poidsKg: 100,
      personnaliteIds: ['bosseur', 'flair', 'calme'], paysCentreId: 'FR', clubId: 'clermont' }, seed);
    let g = 0, pic = 0;
    while (s.phase !== 'fin' && s.player.age < 27 && g++ < 3000) {
      if (s.phase === 'bilan') { s = advance(s); continue; }
      if (s.evenementEnCours) { s = choose(s, seed % 2); continue; }
      if (s.phase === 'offres') { s = acceptOffer(s, 0); continue; }
      s = advance(s);
      const o = overall(s.player.stats, s.player.positionId); pic = Math.max(pic, o);
      if (s.periodeIndex === 0 && s.player.age === 21) a21.push(o);
      if (s.periodeIndex === 0 && s.player.age === 24) a24.push(o);
    }
    pics.push(pic);
  }
  assert.ok(med(a21) >= 74, `médiane à 21 ans : ${med(a21)}`);
  assert.ok(med(a24) >= 82, `médiane à 24 ans : ${med(a24)}`);
  assert.ok(pics.filter(x => x >= 85).length >= 30, `pic ≥ 85 : ${pics.filter(x => x >= 85).length}/60`);
});
