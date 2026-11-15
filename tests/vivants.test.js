import { test } from 'node:test';
import assert from 'node:assert/strict';
import { drawEvent, eventById, DELAI_REPETITION } from '../src/engine/events.js';
import { createRng } from '../src/engine/rng.js';
import { clubById } from '../src/data/leagues/index.js';
import { STAT_KEYS } from '../src/data/positions.js';
import { newCareer, advance, choose } from '../src/engine/career.js';

const player = { prenom: 'A', nom: 'B', age: 24, nationaliteId: 'FR', positionId: 'demi-de-melee', personnaliteIds: ['calme', 'fidele', 'studieux'],
  stats: Object.fromEntries(STAT_KEYS.map(k => [k, 70])), potentiel: 90, moral: 70, forme: 70, blessure: null, clubId: 'toulouse', historique: [] };

test('un événement vivant cite de vrais joueurs du club', () => {
  const ev = eventById('v-rival-poste', null);
  const rng = createRng(2);
  let trouve = null;
  for (let i = 0; i < 400 && !trouve; i++) {
    const e = drawEvent({ phase: 'pro', annee: 2027, flags: [], vusSaison: [], vus: {}, player, saisonStats: { notes: [] } }, 'automne', rng);
    if (e?.id === 'v-rival-poste') trouve = e;
  }
  assert.ok(trouve, 'événement tiré');
  const noms = clubById('toulouse').joueurs.map(j => j.nom);
  assert.ok(noms.some(n => trouve.texte.includes(n)), trouve.texte);
  assert.ok(trouve.texte.includes('Antoine Dupont') || trouve.texte.includes('Paul Graou'));
});

test('délai sans répétition : 4 saisons', () => assert.equal(DELAI_REPETITION, 4));

test('les variables d’un événement survivent à la sauvegarde et au choix', () => {
  let s = newCareer({ prenom: 'A', nom: 'B', nationaliteId: 'FR', positionId: 'centre', tailleCm: 185, poidsKg: 95,
    personnaliteIds: ['bosseur', 'calme', 'fidele'], paysCentreId: 'FR', clubId: 'toulouse' }, 6);
  let g = 0, vu = false;
  while (g++ < 200 && !vu) {
    if (s.evenementEnCours && s.phase !== 'bilan') {
      if (s.evenementVars) {
        vu = true;
        const copie = JSON.parse(JSON.stringify(s));
        const ev = eventById(copie.evenementEnCours, copie.evenementVars);
        assert.ok(!ev.texte.includes('undefined'), ev.texte);
        const apres = choose(copie, 0);
        assert.ok(!apres.journal.at(-1).includes('undefined'));
      }
      s = choose(s, 0);
    } else s = advance(s);
  }
  assert.ok(vu, 'au moins un événement vivant pendant le centre');
});
