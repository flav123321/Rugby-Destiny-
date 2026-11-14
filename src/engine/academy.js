import { PERIODES, drawEvent } from './events.js';
import { progressSeason } from './progression.js';
import { rollInjury, tickInjury } from './injuries.js';
import { overall } from './rating.js';
import { TOP14 } from '../data/leagues/top14.js';

export const MAX_MATCHS_LISTES = 12;

export const CATEGORIES = { 16: 'Cadets (U16)', 17: 'Crabos (U18)', 18: 'Espoirs' };
export const SAISON_DEPART = 2026;
export const saisonLabel = (annee) => `${annee}-${String((annee + 1) % 100).padStart(2, '0')}`;

export function newAcademyState(player) {
  return { phase: 'centre', annee: SAISON_DEPART, periodeIndex: -1, periode: null, flags: [], vusSaison: [], vus: {}, matchsJeunes: [], journal: [],
    evenementEnCours: null, offresContrat: null, player, saisonStats: { matchs: 0, titularisations: 0, minutes: 0, essais: 0, points: 0, notes: [] } };
}

/** Un match hors Top 14 (jeunes, prêt) : adversaire, score et perf du joueur, pour l'affichage. */
export function matchListe(categorie, adversaire, perf, rng) {
  const domicile = rng.chance(0.5);
  const nous = rng.int(3, 40), eux = rng.int(3, 38);
  return { categorie, adversaire, domicile, score: domicile ? `${nous}-${eux}` : `${eux}-${nous}`, gagne: nous > eux, perf };
}
export const pushListe = (liste, m) => [...(liste ?? []), m].slice(-MAX_MATCHS_LISTES);

/** Matchs de catégorie joués sur une période (≈ 4 matchs). */
function jeunesMatchs(state, rng) {
  const p = state.player;
  const st = { ...state.saisonStats, notes: [...state.saisonStats.notes] };
  if (p.blessure) return { st, liste: state.matchsJeunes ?? [] };
  let liste = state.matchsJeunes ?? [];
  const adversaires = TOP14.clubs.filter(c => c.id !== p.clubId);
  const ovr = overall(p.stats, p.positionId);
  const seuil = 42 + (p.age - 16) * 5; // le niveau requis monte avec la catégorie
  for (let i = 0; i < 4; i++) {
    st.matchs++;
    const titulaire = ovr + rng.int(-6, 6) >= seuil;
    if (titulaire) st.titularisations++;
    const minutes = titulaire ? rng.int(50, 80) : rng.int(0, 30);
    st.minutes += minutes;
    let perf = { statut: titulaire ? 'titulaire' : 'remplacant', minutes, essais: 0, note: null };
    if (minutes > 0) {
      const essais = rng.chance(0.12) ? 1 : 0;
      st.essais += essais; st.points += essais * 5;
      const note = Math.max(0, Math.min(10, Math.round((5 + (ovr - seuil) / 6 + rng.next() * 2 - 1) * 10) / 10));
      st.notes.push(note);
      perf = { ...perf, essais, note };
    } else perf = { ...perf, statut: 'banc' };
    liste = pushListe(liste, matchListe(CATEGORIES[p.age], rng.pick(adversaires).nom, perf, rng));
  }
  return { st, liste };
}

/** Fin du parcours : offres selon la note. */
export function academyOffers(player) {
  const ovr = overall(player.stats, player.positionId);
  if (ovr >= 58) return [{ type: 'pro', clubId: player.clubId, duree: 3, role: 'espoir' }];
  if (ovr >= 50) return [{ type: 'pret', clubId: player.clubId, duree: 1, division: 'Pro D2', role: 'rotation' },
    { type: 'pret', clubId: player.clubId, duree: 1, division: 'Nationale', role: 'titulaire' }];
  return [{ type: 'liberation', clubId: null, duree: 0 }];
}

/** Avance d'une période au centre de formation. */
export function academyStep(state, rng) {
  if (state.offresContrat) return state;
  let s = { ...state };
  let idx = s.periodeIndex + 1;
  if (idx >= PERIODES.length) {
    // fin de saison : progression, anniversaire, nouvelle saison
    const player = progressSeason(s.player, { minutesJouees: s.saisonStats.minutes, entrainementBonus: 1 }, rng);
    const { notes, ...st } = s.saisonStats;
    const noteMoyenne = notes.length ? Math.round(notes.reduce((a, b) => a + b, 0) / notes.length * 10) / 10 : null;
    const resume = { saison: saisonLabel(s.annee), age: s.player.age, categorie: CATEGORIES[s.player.age], niveau: CATEGORIES[s.player.age],
      club: s.clubNom ?? null, ...st, noteMoyenne };
    s.player = { ...player, age: player.age + 1, historique: [...player.historique, resume] };
    s.annee += 1; s.vusSaison = [];
    s.saisonStats = { matchs: 0, titularisations: 0, minutes: 0, essais: 0, points: 0, notes: [] };
    if (s.player.age >= 19) { s.offresContrat = academyOffers(s.player); s.periode = null; s.evenementEnCours = null; return s; }
    idx = 0;
  }
  s.periodeIndex = idx;
  s.periode = PERIODES[idx];
  s.player = tickInjury(s.player, 6);
  if (!s.player.blessure) { const b = rollInjury(s.player, rng); if (b) s.player = { ...s.player, blessure: b }; }
  if (s.periode !== 'ete') { const r = jeunesMatchs(s, rng); s.saisonStats = r.st; s.matchsJeunes = r.liste; }
  s.evenementEnCours = drawEvent(s, s.periode, rng);
  return s;
}
