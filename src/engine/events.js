import { EVENTS } from '../data/events.js';
import { clampStat } from './player.js';

export const PERIODES = ['presaison', 'automne', 'hiver', 'printemps', 'ete'];
export const PERIODE_LABELS = { presaison: 'Présaison', automne: 'Automne', hiver: 'Hiver', printemps: 'Printemps', ete: 'Été' };
const val = (x, v) => (typeof x === 'function' ? x(v ?? {}) : x);
/** Rend un événement concret : les textes « vivants » (fonctions) sont remplis avec ses variables (noms, clubs…). */
export function resolveEvent(tpl, vars = null) {
  if (!tpl) return null;
  return { ...tpl, vars, texte: val(tpl.texte, vars),
    choix: tpl.choix.map(c => ({ ...c, label: val(c.label, vars), effets: { ...c.effets, texteResultat: val(c.effets.texteResultat, vars) } })) };
}
export const eventById = (id, vars = null) => resolveEvent(EVENTS.find(e => e.id === id), vars);

/** Un événement vu ne revient pas avant DELAI_REPETITION saisons (sauf si plus rien d'autre n'est possible). */
export const DELAI_REPETITION = 4;

export function drawEvent(state, periode, rng) {
  const vus = state.vus ?? {};
  const recent = (e) => vus[e.id] !== undefined && (state.annee ?? 0) - vus[e.id] < DELAI_REPETITION;
  const tpl = tirage(state, periode, rng, recent) ?? tirage(state, periode, rng, () => false);
  if (!tpl) return null;
  return resolveEvent(tpl, tpl.vars ? tpl.vars(state, rng) : null);
}

function tirage(state, periode, rng, exclu) {
  const apte = !state.player.blessure;
  const pool = EVENTS.filter(e => !exclu(e) &&
    (e.phase === state.phase || e.phase === 'tous') &&
    (!e.periode || e.periode === periode) &&
    !(state.vusSaison ?? []).includes(e.id) &&
    (apte || !e.tags?.includes('requiertApte')) &&
    (!e.condition || e.condition(state)) &&
    (!e.vars || e.vars(state, { next: () => 0, int: (a) => a, pick: (x) => x[0], chance: () => false }) !== null));
  if (!pool.length) return null;
  // les événements jamais vus sortent trois fois plus souvent
  const vus = state.vus ?? {};
  const poids = (e) => (e.poids ?? 1) * (vus[e.id] === undefined ? 3 : 1);
  const total = pool.reduce((s, e) => s + poids(e), 0);
  let r = rng.next() * total;
  for (const e of pool) { r -= poids(e); if (r <= 0) return e; }
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
