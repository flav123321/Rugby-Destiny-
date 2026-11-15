// Montées et descentes entre Top 14, Pro D2 et Nationale à la fin de chaque saison.
import { LEAGUES, leagueById, clubById, setMonde } from '../data/leagues/index.js';
import { simulateSeason, standings, playoffs, teamStrength } from './season.js';
import { simulateMatch } from './match.js';

function barrage(hautId, basId, forces, rng) {
  // match d'accession chez le club de la division supérieure
  const m = simulateMatch({ id: hautId, force: forces[hautId] }, { id: basId, force: forces[basId] }, null, rng);
  if (m.scoreHome === m.scoreAway) return rng.chance(0.5) ? hautId : basId;
  return m.scoreHome > m.scoreAway ? hautId : basId;
}

/**
 * monde : { top14: [ids], prod2: [ids], nationale: [ids] }.
 * resultatsJoueur : { leagueId, table, po } pour la division du joueur (déjà jouée), sinon tout est simulé.
 */
export function evolveMonde(monde, resultatsJoueur, rng) {
  setMonde(monde);
  const res = {};
  const forces = {};
  for (const l of LEAGUES) {
    for (const c of l.clubs) forces[c.id] = teamStrength(c, null);
    if (resultatsJoueur?.leagueId === l.id) { res[l.id] = resultatsJoueur; continue; }
    const s = simulateSeason(l.clubs, null, rng);
    const table = standings(s.results);
    res[l.id] = { table, po: playoffs(table, rng, s.forces) };
  }
  const ids = (id) => res[id].table.map(r => r.clubId);
  const finaliste = (po) => (po.finale.home === po.champion ? po.finale.away : po.finale.home);
  const nom = (id) => clubById(id)?.nom ?? id;
  const t14 = ids('top14'), pd2 = ids('prod2'), nat = ids('nationale');
  const mouvements = [];
  const next = { top14: [...monde.top14], prod2: [...monde.prod2], nationale: [...monde.nationale] };
  const deplace = (id, de, vers, texte) => { next[de] = next[de].filter(x => x !== id); next[vers].push(id); mouvements.push({ clubId: id, de, vers, texte }); };

  // Top 14 ↔ Pro D2 : le 14e descend, le champion de Pro D2 monte ; barrage 13e de Top 14 – finaliste de Pro D2
  const champPd2 = res.prod2.po.champion, finPd2 = finaliste(res.prod2.po);
  deplace(t14[13], 'top14', 'prod2', `${nom(t14[13])} est relégué en Pro D2`);
  deplace(champPd2, 'prod2', 'top14', `${nom(champPd2)}, champion de Pro D2, monte en Top 14`);
  const vainqueurB1 = barrage(t14[12], finPd2, forces, rng);
  if (vainqueurB1 === finPd2) { deplace(t14[12], 'top14', 'prod2', `${nom(t14[12])} perd le barrage et descend en Pro D2`); deplace(finPd2, 'prod2', 'top14', `${nom(finPd2)} gagne le barrage et monte en Top 14`); }
  else mouvements.push({ clubId: t14[12], texte: `${nom(t14[12])} se maintient en Top 14 en gagnant le barrage` });

  // Pro D2 ↔ Nationale : le 16e descend, le champion de Nationale monte ; Access Match 15e de Pro D2 – finaliste de Nationale
  const champNat = res.nationale.po.champion, finNat = finaliste(res.nationale.po);
  const der = pd2.filter(id => id !== champPd2 && id !== finPd2);
  const d16 = der[der.length - 1], d15 = der[der.length - 2];
  deplace(d16, 'prod2', 'nationale', `${nom(d16)} est relégué en Nationale`);
  deplace(champNat, 'nationale', 'prod2', `${nom(champNat)}, champion de Nationale, monte en Pro D2`);
  const vainqueurB2 = barrage(d15, finNat, forces, rng);
  if (vainqueurB2 === finNat) { deplace(d15, 'prod2', 'nationale', `${nom(d15)} perd l'Access Match et descend en Nationale`); deplace(finNat, 'nationale', 'prod2', `${nom(finNat)} gagne l'Access Match et monte en Pro D2`); }
  else mouvements.push({ clubId: d15, texte: `${nom(d15)} se maintient en Pro D2 après l'Access Match` });

  const champions = { top14: nom(res.top14.po.champion), prod2: nom(champPd2), nationale: nom(champNat) };
  setMonde(next);
  return { monde: next, mouvements, champions };
}
