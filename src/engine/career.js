import { createRng } from './rng.js';
import { createPlayer } from './player.js';
import { overall } from './rating.js';
import { TOP14 } from '../data/leagues/top14.js';
import { PROD2 } from '../data/leagues/prod2.js';
import { clubById, leagueOfClub, leagueById, allClubs, setMonde, mondeInitial } from '../data/leagues/index.js';
import { evolveMonde } from './monde.js';
import { academyStep, newAcademyState, saisonLabel, CATEGORIES, matchListe, pushListe } from './academy.js';

import { PERIODES, drawEvent, applyChoice, eventById } from './events.js';
import { buildFixtures, standings, playoffs, teamStrength, playDay } from './season.js';
import { progressSeason } from './progression.js';
import { rollInjury, tickInjury } from './injuries.js';
import { periodeInternationale, resumeInter } from './inter-career.js';
import { roleFor } from './roles.js';

// Répartition des journées du championnat sur les périodes (26 en Top 14 et Nationale, 30 en Pro D2).
function journees(periode, n) {
  const a = Math.round(n * 0.35), h = Math.round(n * 0.66);
  return { presaison: [0, 0], automne: [0, a], hiver: [a, h], printemps: [h, n], ete: [n, n] }[periode];
}
/** Niveau d'un club : moyenne de ses 23 meilleurs joueurs. */
export const niveauClub = (club) => teamStrength(club, null);
const videEspoirs = () => ({ matchs: 0, titularisations: 0, minutes: 0, essais: 0, points: 0, notes: [] });
const vide = () => ({ matchs: 0, titularisations: 0, minutes: 0, essais: 0, points: 0, plaquages: 0, notes: [], espoirs: videEspoirs() });
export const AGE_MAX_ESPOIRS = 22;
const TRY_ESPOIRS = { ailier: 0.3, arriere: 0.2, centre: 0.2, 'numero-8': 0.15, 'troisieme-ligne-aile': 0.12, talonneur: 0.12 };

/** Match avec l'équipe Espoirs du club, quand le joueur n'est pas retenu en Top 14. */
function matchEspoirs(player, esp, rng) {
  const ovr = overall(player.stats, player.positionId);
  const seuil = 56; // niveau du championnat Espoirs
  const tit = ovr + rng.int(-6, 6) >= seuil;
  esp.matchs++;
  if (tit) esp.titularisations++;
  const minutes = tit ? rng.int(55, 80) : rng.int(15, 35);
  esp.minutes += minutes;
  const essais = rng.chance((TRY_ESPOIRS[player.positionId] ?? 0.07) * minutes / 80) ? 1 : 0;
  esp.essais += essais; esp.points += essais * 5;
  const note = Math.max(0, Math.min(10, Math.round((5.5 + (ovr - seuil) / 6 + essais * 0.8 + rng.next() * 2 - 1) * 10) / 10));
  esp.notes.push(note);
  return { statut: tit ? 'titulaire' : 'remplacant', minutes, essais, note };
}

function withRng(state, fn) {
  const rng = createRng(0); rng.setState(state.rngState);
  const out = fn(rng);
  return { ...out, rngState: rng.getState() };
}
const toId = (s) => ({ ...s, evenementEnCours: s.evenementEnCours ? s.evenementEnCours.id : null, evenementVars: s.evenementEnCours?.vars ?? null });

/** 3 centres de formation proposés : un grand club et deux tirés au hasard. */
export function academyClubOffers(rng) {
  const clubs = [...TOP14.clubs];
  const pd2 = PROD2.clubs.filter(c => c.centreFormation >= 3);
  const grands = clubs.filter(c => c.centreFormation >= 4);
  const premier = rng.pick(grands);
  const reste = clubs.filter(c => c.id !== premier.id);
  const a = reste.splice(rng.int(0, reste.length - 1), 1)[0];
  const b = rng.pick(pd2); // un centre de formation de Pro D2
  return [premier.id, a.id, b.id];
}

export function newCareer(input, seed) {
  const rng = createRng(seed);
  const { clubId, ...rest } = input;
  if (!clubById(clubId)) throw new Error(`Club inconnu : ${clubId}`);
  const player = { ...createPlayer(rest, rng), clubId };
  const s = newAcademyState(player);
  if (player.pepite) s.journal = ["Les recruteurs parlent déjà de toi comme d'une pépite."];
  setMonde(null);
  return { version: 1, seed, ...s, monde: mondeInitial(), clubNom: clubById(clubId).nom, ligue: null, pret: null, contratFin: null, dernierResume: null, rngState: rng.getState() };
}

/** Avance d'une période. Ne fait rien si un choix est en attente. */
export function advance(state) {
  setMonde(state.monde);
  if (state.phase === 'bilan') return { ...state, phase: state.phaseApresBilan ?? 'pro', phaseApresBilan: null };
  if (state.evenementEnCours || state.phase === 'offres' || state.phase === 'fin') return state;
  if (state.phase === 'centre') {
    return withRng(state, (rng) => {
      const ev = state.evenementEnCours;
      const s = academyStep({ ...state, evenementEnCours: ev ? eventById(ev, state.evenementVars) : null }, rng);
      if (s.offresContrat) {
        const last = s.player.historique.at(-1);
        return { ...toId(s), phase: 'offres', dernierResume: { ...last, niveau: CATEGORIES[last.age], club: clubById(s.player.clubId).nom } };
      }
      if (s.annee > state.annee) {
        // fin d'une saison au centre : les divisions évoluent, bilan avant de continuer
        const evo = evolveMonde(state.monde ?? mondeInitial(), null, rng);
        return { ...toId(s), monde: evo.monde, phase: 'bilan', phaseApresBilan: 'centre',
          dernierResume: { ...s.player.historique.at(-1), mouvements: evo.mouvements, champions: evo.champions } };
      }
      return toId(s);
    });
  }
  return withRng(state, (rng) => proStep(state, rng));
}

function initLigue(state) {
  const league = leagueOfClub(state.player.clubId);
  return { leagueId: league.id, fixtures: buildFixtures(league.clubs.map(c => c.id)), journee: 0, results: [], joueurMatchs: [] };
}

function proStep(state, rng) {
  let s = { ...state };
  let idx = s.periodeIndex + 1;
  if (idx >= PERIODES.length) return finDeSaison(s, rng);
  s.periodeIndex = idx; s.periode = PERIODES[idx];
  if (!s.ligue) s.ligue = initLigue(s);
  s.player = tickInjury(s.player, 6);
  if (!s.player.blessure) { const b = rollInjury(s.player, rng); if (b) s.player = { ...s.player, blessure: b }; }

  const inter = periodeInternationale(s, rng);
  s = inter.state;
  const league = leagueById(s.ligue.leagueId ?? 'top14');
  const clubs = league.clubs;
  const [from, to] = journees(s.periode, s.ligue.fixtures.length);
  const absents = new Set();
  const plage = Array.from({ length: to - from }, (_, i) => from + i);
  while (absents.size < Math.min(inter.absences, plage.length)) absents.add(rng.pick(plage));
  const ligue = { ...s.ligue, results: [...s.ligue.results], joueurMatchs: [...s.ligue.joueurMatchs] };
  const st = { ...s.saisonStats, notes: [...s.saisonStats.notes] };
  const esp = s.saisonStats.espoirs ? { ...s.saisonStats.espoirs, notes: [...s.saisonStats.espoirs.notes] } : videEspoirs();
  st.espoirs = esp;
  const playerTop14 = s.player;
  const forces = Object.fromEntries(clubs.map(c => [c.id, teamStrength(c, playerTop14)]));
  for (let j = from; j < to; j++) {
    for (const [h, a] of ligue.fixtures[j]) {
      const m = playDay(h, a, clubs, forces, playerTop14, rng, absents.has(j));
      const { perfJoueur, ...res } = m;
      ligue.results.push(res);
      if (playerTop14 && (h === s.player.clubId || a === s.player.clubId)) {
        if (perfJoueur) {
          st.matchs++;
          if (perfJoueur.statut === 'titulaire') st.titularisations++;
          st.minutes += perfJoueur.minutes; st.essais += perfJoueur.essais; st.points += perfJoueur.points;
          st.plaquages += perfJoueur.plaquages; st.notes.push(perfJoueur.note);
        }
        const espoirs = !perfJoueur && !absents.has(j) && !s.player.blessure && s.player.age <= AGE_MAX_ESPOIRS ? matchEspoirs(s.player, esp, rng) : null;
        ligue.joueurMatchs.push({ journee: j + 1, home: h, away: a, score: `${res.scoreHome}-${res.scoreAway}`, perf: perfJoueur, espoirs });
      }
    }
    ligue.journee = j + 1;
  }
  s.ligue = ligue; s.saisonStats = st;
  s.evenementEnCours = drawEvent(s, s.periode, rng);
  return toId(s);
}

function finDeSaison(s, rng) {
  const league = leagueById(s.ligue.leagueId ?? 'top14');
  const table = standings(s.ligue.results);
  const forces = Object.fromEntries(league.clubs.map(c => [c.id, teamStrength(c, s.player)]));
  const po = playoffs(table, rng, forces);
  const rang = table.findIndex(r => r.clubId === s.player.clubId) + 1;
  const resume = { ...seasonSummary(s), classementClub: rang, champion: clubById(po.champion).nom,
    finale: `${clubById(po.finale.home).nom} ${po.finale.scoreHome}-${po.finale.scoreAway} ${clubById(po.finale.away).nom}`,
    relegue: clubById(po.relegue).nom, championAvecLui: po.champion === s.player.clubId, ligueId: league.id,
    niveau: s.pret ? `${league.label} (prêt)` : league.label, tableau: table };
  const evo = evolveMonde(s.monde ?? mondeInitial(), { leagueId: league.id, table, po }, rng);
  resume.mouvements = evo.mouvements;
  resume.champions = evo.champions;
  const monClub = evo.mouvements.find(m => m.clubId === s.player.clubId && m.vers);
  if (monClub) resume.monClub = monClub.vers === 'top14' || (monClub.vers === 'prod2' && monClub.de === 'nationale') ? 'monte' : 'descend';
  resume.distinctions = [...distinctions(s, resume, rng, league), ...(s.interSaison ?? []).map(c => c.distinction).filter(Boolean)];
  const { tableau, ...histo } = resume;
  const progressed = progressSeason(s.player, { minutesJouees: s.saisonStats.minutes + (s.saisonStats.espoirs?.minutes ?? 0) / 2 }, rng);
  const player = { ...progressed, age: progressed.age + 1, historique: [...progressed.historique, histo] };
  const out = { ...s, monde: evo.monde, player, annee: s.annee + 1, periodeIndex: -1, periode: null, vusSaison: [], saisonStats: vide(),
    ligue: null, dernierResume: resume, evenementEnCours: null, interSaison: [] };
  if (s.pret) {
    // retour de prêt au club formateur
    const parent = s.pret.clubParent ?? s.player.clubId;
    const retour = { ...out, pret: null, clubNom: clubById(parent).nom, player: { ...out.player, clubId: parent } };
    return { ...retour, phase: 'offres', offresContrat: contractOffers(retour, rng) };
  }
  if (out.annee >= out.contratFin) return { ...out, phase: 'offres', offresContrat: contractOffers(out, rng) };
  return { ...out, phase: 'bilan', phaseApresBilan: 'pro' };
}

/** Récompenses de fin de saison, propres au championnat joué. */
function distinctions(s, r, rng, league) {
  const L = league.label;
  const du = league.niveau === 1 ? `du ${L}` : `de la ${L}`;
  const ovr = overall(s.player.stats, s.player.positionId);
  const d = [];
  const moy = r.noteMoyenne ?? 0;
  const deja = (t) => s.player.historique.some(h => h.distinctions?.includes(t));
  if (s.player.age <= 21 && r.matchs >= 10 && moy >= 6.3 && !deja(`Révélation ${du}`)) d.push(`Révélation ${du}`);
  if (r.titularisations >= 15 && moy >= 7) d.push(`Équipe type ${du}`);
  if (ovr >= (league.niveau === 1 ? 87 : league.niveau === 2 ? 76 : 68) && r.titularisations >= 15 && moy >= 7.3 && rng.chance(0.4)) d.push(`Meilleur joueur ${du}`);
  if (r.championAvecLui && league.niveau === 2) d.push('Champion de Pro D2 (montée en Top 14)');
  if (r.championAvecLui && league.niveau === 3) d.push('Champion de Nationale');
  if (s.player.age >= 21 && ovr >= 93 && r.titularisations >= 16 && moy >= 7.6 && rng.chance(0.35)) d.push('Meilleur joueur du monde World Rugby');
  return d;
}

export function choose(state, choixIndex) {
  if (!state.evenementEnCours) throw new Error('Aucun événement en cours');
  const ev = eventById(state.evenementEnCours, state.evenementVars);
  const s = applyChoice(state, ev, choixIndex);
  const prolongation = ev.choix[choixIndex].effets.prolongation;
  const contratFin = prolongation && s.contratFin ? s.contratFin + prolongation : s.contratFin;
  return { ...s, contratFin, evenementEnCours: null, evenementVars: null };
}

/** Accepte une offre (fin du centre ou fin de contrat). */
export function acceptOffer(state, i) {
  setMonde(state.monde);
  const o = state.offresContrat?.[i];
  if (!o) throw new Error(`Offre invalide : ${i}`);
  const base = { ...state, offresContrat: null, phase: 'pro', periodeIndex: -1, periode: null, saisonStats: vide(), ligue: null };
  if (o.type === 'centre') return { ...state, offresContrat: null, phase: 'centre', journal: [...state.journal, 'Tu termines ta formation au centre.'] };
  if (o.type === 'liberation') return { ...base, phase: 'fin', journal: [...state.journal, "Le club ne te garde pas. Fin de l'aventure… pour l'instant."] };
  if (o.type === 'pret') {
    const cible = (o.division === 'Pro D2' ? leagueById('prod2') : leagueById('nationale')).clubs;
    const club = o.pretClubId ? clubById(o.pretClubId) : cible[Math.floor(((state.rngState ?? 1) % 997) / 997 * cible.length)];
    return { ...base, pret: { division: o.division, clubParent: state.player.clubId }, clubNom: club.nom, player: { ...state.player, clubId: club.id },
      contratFin: state.annee + 1, journal: [...state.journal, `Prêt d'un an à ${club.nom} (${o.division}).`] };
  }
  return { ...base, pret: null, clubNom: clubById(o.clubId).nom, player: { ...state.player, clubId: o.clubId }, contratFin: state.annee + o.duree,
    journal: [...state.journal, `Contrat de ${o.duree} an${o.duree > 1 ? 's' : ''} signé avec ${clubById(o.clubId).nom} (${o.role}).`] };
}

const moyenne = (n) => n?.length ? Math.round(n.reduce((a, b) => a + b, 0) / n.length * 10) / 10 : null;

export function seasonSummary(state) {
  const st = state.saisonStats;
  const notes = st.notes ?? [];
  const e = st.espoirs;
  const espoirs = e && e.matchs ? { matchs: e.matchs, titularisations: e.titularisations, minutes: e.minutes, essais: e.essais, points: e.points, noteMoyenne: moyenne(e.notes) } : null;
  return { saison: saisonLabel(state.annee), age: state.player.age, club: clubById(state.player.clubId)?.nom ?? '—',
    matchs: st.matchs, titularisations: st.titularisations, minutes: st.minutes, essais: st.essais, points: st.points,
    noteMoyenne: moyenne(notes), espoirs, inter: resumeInter(st.inter), u20: resumeInter(st.u20),
    competitions: state.interSaison ?? [] };
}

/** Offres de contrat selon la note du joueur, dans les trois divisions françaises. */
export function contractOffers(state, rng) {
  const p = state.player;
  const ovr = overall(p.stats, p.positionId);
  const own = clubById(p.clubId);
  const offers = [];
  const ajoute = (club, duree) => { if (club && !offers.some(o => o.clubId === club.id)) offers.push({ type: 'pro', clubId: club.id, duree, role: roleFor(club, p) }); };
  // un club recrute un joueur proche de son niveau (rotation au minimum), ou nettement au-dessus
  const clubs = allClubs().map(c => ({ c, n: niveauClub(c) }));
  const adaptes = clubs.filter(({ c, n }) => c.id !== p.clubId && ovr >= n - 9 && ovr <= n + 14).sort((a, b) => b.n - a.n);
  if (own && ovr >= niveauClub(own) - 10) ajoute(own, rng.int(1, 3));
  const nb = ovr >= 70 ? 3 : 2;
  const pool = adaptes.slice(0, 8);
  while (offers.length < nb && pool.length) ajoute(pool.splice(rng.int(0, pool.length - 1), 1)[0].c, rng.int(1, 4));
  if (!offers.length) {
    // filet de sécurité : le club de Nationale le plus proche de son niveau
    const plusProche = clubs.filter(x => leagueOfClub(x.c.id).niveau === 3).sort((a, b) => Math.abs(a.n - ovr) - Math.abs(b.n - ovr));
    ajoute(plusProche[0].c, 1); ajoute(plusProche[1].c, 2);
  }
  // un jeune barré dans son club peut partir en prêt dans la division du dessous
  const lvl = leagueOfClub(p.clubId)?.niveau;
  if (own && p.age <= 23 && lvl < 3 && ovr < niveauClub(own) - 6) offers.push({ type: 'pret', clubId: p.clubId, duree: 1, division: lvl === 1 ? 'Pro D2' : 'Nationale', role: 'titulaire' });
  return offers;
}

export function retire(state) {
  return { ...state, phase: 'fin', evenementEnCours: null, journal: [...(state.journal ?? []), `Fin de carrière à ${state.player.age} ans.`] };
}
