// Intègre une fenêtre internationale dans l'état de carrière (stats, liste de matchs, sélections).
import { playWindow } from './international.js';

const PERIODES_INTER = ['automne', 'hiver', 'ete'];
const vide = () => ({ matchs: 0, titularisations: 0, minutes: 0, essais: 0, points: 0, notes: [] });
const moyenne = (n) => n?.length ? Math.round(n.reduce((a, b) => a + b, 0) / n.length * 10) / 10 : null;

export function resumeInter(st) {
  return st && st.matchs ? { matchs: st.matchs, titularisations: st.titularisations, minutes: st.minutes, essais: st.essais, points: st.points, noteMoyenne: moyenne(st.notes) } : null;
}

/** Joue la fenêtre de la période (s'il y en a une) et renvoie { state, absences }. */
export function periodeInternationale(s, rng) {
  if (!PERIODES_INTER.includes(s.periode)) return { state: s, absences: 0 };
  const w = playWindow(s.player, s.annee, s.periode, rng);
  if (!w) return { state: s, absences: 0 };
  const cle = w.niveau === 'A' ? 'inter' : 'u20';
  const st = { ...s.saisonStats };
  const b = st[cle] ? { ...st[cle], notes: [...st[cle].notes] } : vide();
  let liste = s.matchsInter ?? [];
  for (const m of w.matchs) {
    if (m.perf) {
      b.matchs++; if (m.perf.statut === 'titulaire') b.titularisations++;
      b.minutes += m.perf.minutes; b.essais += m.perf.essais; b.points += m.perf.points; b.notes.push(m.perf.note);
    }
    if (w.selectionne) liste = [...liste, { competition: w.competition, niveau: w.niveau, ...m }].slice(-10);
  }
  st[cle] = b;
  const player = { ...s.player,
    selections: (s.player.selections ?? 0) + w.caps,
    selectionsU20: (s.player.selectionsU20 ?? 0) + (w.niveau === 'U20' ? w.matchs.filter(m => m.perf).length : 0) };
  const journal = w.selectionne && player.selections > 0 && (s.player.selections ?? 0) === 0
    ? [...s.journal, `Première sélection en équipe nationale ! (${w.competition})`] : s.journal;
  const interSaison = [...(s.interSaison ?? []), { competition: w.competition, niveau: w.niveau, selectionne: w.selectionne, resultat: w.resultat, distinction: w.distinction }];
  return { state: { ...s, saisonStats: st, matchsInter: liste, player, journal, interSaison, derniereFenetre: w }, absences: w.absencesClub };
}
