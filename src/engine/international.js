import { NATIONS, SIX_NATIONS, NATIONS_CHAMPIONSHIP, NOMS } from '../data/nations.js';
import { SQUADS } from '../data/nations-squads.js';
import { NATIONALITIES, nationalityById } from '../data/nationalities.js';
import { POSITIONS, positionById } from '../data/positions.js';
import { TOP14 } from '../data/leagues/top14.js';
import { overall } from './rating.js';
import { simulateMatch } from './match.js';
import { standings } from './season.js';

const POS = { PG: 'pilier-gauche', PD: 'pilier-droit', TA: 'talonneur', '2L': 'deuxieme-ligne', '3L': 'troisieme-ligne-aile',
  N8: 'numero-8', DM: 'demi-de-melee', DO: 'demi-d-ouverture', CE: 'centre', AI: 'ailier', AR: 'arriere' };
const h = (str) => { let x = 2166136261; for (const c of str) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return (x >>> 0) / 4294967296; };
export const nomPays = (id) => nationalityById(id)?.label ?? id;

// ─────────── Effectifs ───────────
const cache = new Map();
/** Vrais joueurs de la nation (clubs du jeu + internationaux connus), complétés par des joueurs générés si un poste manque. */
export function nationalPool(natId) {
  if (cache.has(natId)) return cache.get(natId);
  const base = NATIONS[natId]?.base ?? 65;
  const byName = new Map();
  for (const c of TOP14.clubs) for (const j of c.joueurs) if (j.nationaliteId === natId) byName.set(j.nom, { nom: j.nom, positionId: j.positionId, age: j.age, note: j.note });
  for (const line of SQUADS[natId] ?? []) {
    const [nom, code, note, age] = line.split('|');
    if (!byName.has(nom)) byName.set(nom, { nom, positionId: POS[code], age: Number(age), note: Number(note) });
  }
  const pool = [...byName.values()];
  const [prenoms, noms] = NOMS[natId] ?? NOMS.FR;
  for (const p of POSITIONS) {
    const besoin = p.numeros.length * 2 + 1;
    let i = 0;
    while (pool.filter(j => j.positionId === p.id).length < besoin) {
      const r = h(`${natId}${p.id}${i++}`);
      const nom = `${prenoms[Math.floor(r * prenoms.length)]} ${noms[Math.floor(h(String(r)) * noms.length)]}`;
      if (pool.some(j => j.nom === nom)) continue;
      pool.push({ nom, positionId: p.id, age: 22 + Math.floor(r * 10), note: Math.round(base - 7 + r * 6), genere: true });
    }
  }
  pool.sort((a, b) => b.note - a.note);
  cache.set(natId, pool);
  return pool;
}

/** Force d'une nation : son meilleur XV + un banc de 8. */
export function nationStrength(natId, player = null) {
  const pool = nationalPool(natId);
  const notes = [];
  for (const p of POSITIONS) {
    const n = pool.filter(j => j.positionId === p.id).map(j => j.note);
    if (player && player.nationaliteId === natId && player.positionId === p.id && !player.blessure && player.age >= 18) n.push(overall(player.stats, p.id));
    n.sort((a, b) => b - a);
    notes.push(...n.slice(0, p.numeros.length));
  }
  const brut = notes.reduce((a, b) => a + b, 0) / notes.length;
  // calibrage sur le niveau de référence (les effectifs de club gonflent les nations très représentées en Top 14)
  return brut * 0.6 + ((NATIONS[natId]?.base ?? 65) + 5) * 0.4;
}

// ─────────── Calendrier ───────────
const estCDM = (annee) => annee % 4 === 3; // 2027 Australie, 2031 États-Unis…
/** Fenêtre internationale de la nation pendant une période de la saison `annee` (sept. annee → juin annee+1). */
export function windowFor(annee, periode, natId) {
  const conf = NATIONS[natId]?.conference;
  const nc = NATIONS_CHAMPIONSHIP.includes(natId);
  if (periode === 'automne') {
    if (estCDM(annee)) return { competition: 'Coupe du monde', type: 'cdm', absences: 9 };
    if (annee % 2 === 0) return nc ? { competition: 'Nations Championship', type: 'nc', matchs: 4, absences: 3 } : { competition: 'Nations Cup', type: 'cup', matchs: 3, absences: 2 };
    return { competition: 'Tests d’automne', type: 'tests', matchs: 3, absences: 2 };
  }
  if (periode === 'hiver') return SIX_NATIONS.includes(natId) ? { competition: 'Tournoi des Six Nations', type: '6n', matchs: 5, absences: 4 } : null;
  if (periode === 'ete') {
    const y = annee + 1;
    if (y % 2 === 0 && !estCDM(y)) return nc ? { competition: 'Nations Championship', type: 'nc', matchs: 3, absences: 0 } : { competition: 'Nations Cup', type: 'cup', matchs: 3, absences: 0 };
    return { competition: 'Tests d’été', type: 'tests', matchs: 3, absences: 0 };
  }
  return conf ? null : null;
}
function windowU20(periode, natId) {
  if (periode === 'hiver' && SIX_NATIONS.includes(natId)) return { competition: 'Six Nations U20', type: '6n', matchs: 5, absences: 3 };
  if (periode === 'ete') return { competition: 'Championnat du monde U20', type: 'u20', matchs: 5, absences: 0 };
  return null;
}

// ─────────── Sélection ───────────
export function selectNational(player, rng) {
  if (!player || player.blessure || player.age < 18) return 'non-retenu';
  const pos = positionById(player.positionId);
  const moi = overall(player.stats, player.positionId) + ((player.forme ?? 70) - 70) / 10 + (rng.next() * 6 - 3);
  const rivaux = nationalPool(player.nationaliteId).filter(j => j.positionId === player.positionId && j.nom !== `${player.prenom} ${player.nom}`)
    .filter(() => !rng.chance(0.1)).map(j => j.note + (rng.next() * 6 - 3));
  const rang = rivaux.filter(n => n > moi).length;
  if (rang < pos.numeros.length) return 'titulaire';
  if (rang < pos.numeros.length + 1) return 'remplacant';
  return 'non-retenu';
}
function selectU20(player, rng) {
  if (!player || player.blessure || player.age > 20 || player.age < 17) return 'non-retenu';
  const ovr = overall(player.stats, player.positionId) + (rng.next() * 6 - 3);
  const seuil = (NATIONS[player.nationaliteId]?.base ?? 70) - 12;
  return ovr >= seuil + 4 ? 'titulaire' : ovr >= seuil ? 'remplacant' : 'non-retenu';
}

// ─────────── Matchs ───────────
const shuffle = (arr, rng) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = rng.int(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function jouer(nat, adv, forces, player, statut, rng, domicile) {
  const p = player ? { ...player, clubId: nat } : null;
  const [H, A] = domicile ? [nat, adv] : [adv, nat];
  const m = simulateMatch({ id: H, force: forces[H] }, { id: A, force: forces[A] }, p, rng, { statut, buteur: false });
  const nous = domicile ? m.scoreHome : m.scoreAway, eux = domicile ? m.scoreAway : m.scoreHome;
  return { adversaire: adv, domicile, score: `${m.scoreHome}-${m.scoreAway}`, gagne: nous > eux, nul: nous === eux, perf: m.perfJoueur, brut: m };
}

/** Joue une fenêtre internationale pour la nation du joueur. Renvoie null s'il n'y a pas de fenêtre. */
export function playWindow(player, annee, periode, rng) {
  const nat = player.nationaliteId;
  let w = windowFor(annee, periode, nat);
  let niveau = 'A';
  let statut = w ? selectNational(player, rng) : 'non-retenu';
  if (statut === 'non-retenu' && player.age <= 20) {
    const wu = windowU20(periode, nat);
    const su = wu ? selectU20(player, rng) : 'non-retenu';
    if (su !== 'non-retenu') { w = wu; niveau = 'U20'; statut = su; }
  }
  if (!w) return null;
  const selectionne = statut !== 'non-retenu';
  const ids = NATIONALITIES.map(n => n.id);
  const forces = Object.fromEntries(ids.map(id => [id, niveau === 'U20' ? (NATIONS[id]?.base ?? 65) - 12 : nationStrength(id, selectionne && niveau === 'A' && id === nat ? player : null)]));
  if (niveau === 'U20' && selectionne) forces[nat] = (NATIONS[nat]?.base ?? 65) - 12 + (overall(player.stats, player.positionId) - (NATIONS[nat]?.base ?? 65) + 12) / 8;
  const statutMatch = () => (selectionne ? (statut === 'titulaire' ? (rng.chance(0.85) ? 'titulaire' : 'remplacant') : (rng.chance(0.7) ? 'remplacant' : 'non-retenu')) : 'non-retenu');
  const joueur = selectionne ? player : null;
  const matchs = [];
  let resultat = '';
  let distinction = null;

  if (w.type === '6n') {
    const equipes = SIX_NATIONS;
    const results = [];
    for (let i = 0; i < equipes.length; i++) for (let j = i + 1; j < equipes.length; j++) {
      const [a, b] = rng.chance(0.5) ? [equipes[i], equipes[j]] : [equipes[j], equipes[i]];
      if (a === nat || b === nat) {
        const m = jouer(nat, a === nat ? b : a, forces, joueur, statutMatch(), rng, a === nat);
        matchs.push(m); results.push(m.brut);
      } else results.push(simulateMatch({ id: a, force: forces[a] }, { id: b, force: forces[b] }, null, rng));
    }
    const t = standings(results);
    const rang = t.findIndex(r => r.clubId === nat) + 1;
    const gc = rang === 1 && t[0].g === 5;
    resultat = rang === 1 ? (gc ? 'Vainqueur avec le Grand Chelem' : 'Vainqueur du Tournoi') : `${rang}e du Tournoi`;
    if (rang === 1 && selectionne) distinction = gc ? `Grand Chelem${niveau === 'U20' ? ' U20' : ''}` : `Vainqueur du ${w.competition}`;
  } else if (w.type === 'cdm' || w.type === 'u20') {
    // phase de poules (3 matchs, 2 qualifiés) puis élimination directe
    const autres = shuffle(ids.filter(id => id !== nat), rng);
    const poule = autres.slice(0, 3);
    let pts = 0;
    for (const adv of poule) { const m = jouer(nat, adv, forces, joueur, statutMatch(), rng, rng.chance(0.5)); m.tour = 'Poule'; matchs.push(m); pts += m.gagne ? 4 : m.nul ? 2 : 0; }
    const tours = w.type === 'cdm' ? ['Huitième de finale', 'Quart de finale', 'Demi-finale', 'Finale'] : ['Demi-finale', 'Finale'];
    const qualifie = pts >= 8 || (pts >= 4 && rng.chance(0.5));
    if (!qualifie) resultat = 'Éliminé en phase de poules';
    else {
      const parForce = ids.filter(id => id !== nat).sort((a, b) => forces[b] - forces[a]);
      let elimine = false;
      for (let t = 0; t < tours.length; t++) {
        const top = parForce.slice(0, Math.max(3, parForce.length - t * 4));
        const adv = rng.pick(top);
        const m = jouer(nat, adv, forces, joueur, statutMatch(), rng, false);
        m.tour = tours[t];
        if (m.nul) m.gagne = rng.chance(0.5);
        matchs.push(m);
        if (!m.gagne) { resultat = t === tours.length - 1 ? 'Finaliste' : `Éliminé en ${tours[t].toLowerCase()}`; elimine = true; break; }
      }
      if (!elimine) { resultat = w.type === 'cdm' ? 'Champion du monde !' : 'Champion du monde U20 !'; if (selectionne) distinction = w.type === 'cdm' ? 'Champion du monde' : 'Champion du monde U20'; }
    }
  } else {
    const conf = NATIONS[nat]?.conference;
    let candidats = ids.filter(id => id !== nat);
    if (w.type === 'nc') candidats = NATIONS_CHAMPIONSHIP.filter(id => NATIONS[id].conference !== conf);
    if (w.type === 'cup') candidats = ids.filter(id => id !== nat && NATIONS[id].conference === 'cup');
    const adv = shuffle(candidats, rng).slice(0, Math.min(3, candidats.length));
    for (const a of adv) matchs.push(jouer(nat, a, forces, joueur, statutMatch(), rng, periode === 'automne' ? conf === 'nord' : conf !== 'nord'));
    const v = matchs.filter(m => m.gagne).length;
    if (w.type === 'nc' && w.matchs === 4) {
      // Finals Weekend à Twickenham
      const finale = v === 3;
      const advF = finale ? candidats.sort((a, b) => forces[b] - forces[a])[0] : rng.pick(candidats);
      const m = jouer(nat, advF, forces, joueur, statutMatch(), rng, false);
      m.tour = finale ? 'Finale' : 'Match de classement'; if (m.nul) m.gagne = rng.chance(0.5);
      matchs.push(m);
      resultat = finale ? (m.gagne ? 'Vainqueur du Nations Championship' : 'Finaliste du Nations Championship') : `${v + (m.gagne ? 1 : 0)} victoires sur 4`;
      if (finale && m.gagne && selectionne) distinction = 'Vainqueur du Nations Championship';
    } else resultat = `${v} victoire${v > 1 ? 's' : ''} sur ${matchs.length}`;
  }

  for (const m of matchs) delete m.brut;
  const joues = matchs.filter(m => m.perf);
  return { competition: w.competition, niveau, selectionne, statut, matchs, resultat, distinction,
    caps: niveau === 'A' ? joues.length : 0, absencesClub: selectionne ? w.absences : 0 };
}
