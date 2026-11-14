import { EVENTS } from '../data/events.js';
import { clampStat } from './player.js';

export const PERIODES = ['presaison', 'automne', 'hiver', 'printemps', 'ete'];
export const PERIODE_LABELS = { presaison: 'Présaison', automne: 'Automne', hiver: 'Hiver', printemps: 'Printemps', ete: 'Été' };
export const eventById = (id) => EVENTS.find(e => e.id === id);

/** Un événement vu ne revient pas avant DELAI_REPETITION saisons (sauf si plus rien d'autre n'est possible). */
export const DELAI_REPETITION = 2;

export function drawEvent(state, periode, rng) {
  const vus = state.vus ?? {};
  const recent = (e) => vus[e.id] !== undefined && (state.annee ?? 0) - vus[e.id] < DELAI_REPETITION;
  return tirage(state, periode, rng, recent) ?? tirage(state, periode, rng, () => false);
}

function tirage(state, periode, rng, exclu) {
  const apte = !state.player.blessure;
  const pool = EVENTS.filter(e => !exclu(e) &&
    (e.phase === state.phase || e.phase === 'tous') &&
    (!e.periode || e.periode === periode) &&
    !(state.vusSaison ?? []).includes(e.id) &&
    (apte || !e.tags?.includes('requiertApte')) &&
    (!e.condition || e.condition(state)));
  if (!pool.length) return null;
  const total = pool.reduce((s, e) => s + (e.poids ?? 1), 0);
  let r = rng.next() * total;
  for (const e of pool) { r -= e.poids ?? 1; if (r <= 0) return e; }
  return pool.at(-1);
}

const clamp100 = (v) => Math.max(0, Math.min(100, Math.round(v)));

export function applyChoice(state, event, choixIndex) {
  const choix = event.choix[choixIndex];
  if (!choix) throw new Error(`Choix invalide : ${choixIndex}`);
  const e = choix.effets;
  const p = { ...state.player, stats: { ...state.player.stats } };
  for (const [k, v] of Object.entries(e.stats ?? {})) p.stats[k] = clampStat(p.stats[k] + v);
  if (e.moral) p.moral = clamp100(p.moral + e.moral);
  if (e.forme) p.forme = clamp100((p.forme ?? 70) + e.forme);
  if (e.potentiel) p.potentiel = Math.max(40, Math.min(99, p.potentiel + e.potentiel));
  if (e.blessure) p.blessure = { nom: e.blessure.nom, semainesRestantes: e.blessure.semaines };
  return {
    ...state,
    player: p,
    flags: [...new Set([...(state.flags ?? []), ...(e.flags ?? [])])],
    vusSaison: [...(state.vusSaison ?? []), event.id],
    vus: { ...(state.vus ?? {}), [event.id]: state.annee ?? 0 },
    journal: [...(state.journal ?? []), e.texteResultat],
  };
}
