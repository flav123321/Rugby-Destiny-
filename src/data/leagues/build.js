// Construit des effectifs à partir de joueurs réels connus ('Nom|POSTE|PAYS'), complétés par des joueurs générés.
import { NOMS } from '../nations.js';
import { NATIONALITIES } from '../nationalities.js';

export const POS = { PG: 'pilier-gauche', PD: 'pilier-droit', PI: null, TA: 'talonneur', '2L': 'deuxieme-ligne', '3L': 'troisieme-ligne-aile',
  N8: 'numero-8', DM: 'demi-de-melee', DO: 'demi-d-ouverture', CE: 'centre', AI: 'ailier', AR: 'arriere' };
// composition type d'un effectif de 36
const CIBLE = { 'pilier-gauche': 3, 'pilier-droit': 3, talonneur: 3, 'deuxieme-ligne': 5, 'troisieme-ligne-aile': 5, 'numero-8': 2,
  'demi-de-melee': 3, 'demi-d-ouverture': 2, centre: 4, ailier: 4, arriere: 2 };
const NOMS_FR_EXTRA = [['Kylian', 'Nathan', 'Arthur', 'Jules', 'Paul', 'Raphaël', 'Gabin', 'Tom', 'Axel', 'Victor', 'Noa', 'Esteban', 'Mattéo', 'Ugo', 'Adrien', 'Florian', 'Yanis', 'Bastien'],
  ['Cazenave', 'Darrigade', 'Lafargue', 'Barthe', 'Pujol', 'Rouquette', 'Sallaberry', 'Etcheverry', 'Garcia', 'Fabre', 'Lagarde', 'Bonnet', 'Mercier', 'Rivière', 'Faure', 'Dupuy', 'Lacroix', 'Marchal', 'Courrèges', 'Hourcade']];
const natIds = new Set(NATIONALITIES.map(n => n.id));
export const hash = (str) => { let x = 2166136261; for (const c of str) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return (x >>> 0) / 4294967296; };

function nomGenere(seed, nat, pris) {
  const [p, n] = nat === 'FR' ? [[...NOMS.FR[0], ...NOMS_FR_EXTRA[0]], [...NOMS.FR[1], ...NOMS_FR_EXTRA[1]]] : NOMS[nat] ?? NOMS.FR;
  for (let i = 0; i < 50; i++) {
    const r = hash(seed + i);
    const nom = `${p[Math.floor(r * p.length)]} ${n[Math.floor(hash(seed + 'n' + i) * n.length)]}`;
    if (!pris.has(nom)) { pris.add(nom); return nom; }
  }
  return `${p[0]} ${n[0]} ${seed.length}`;
}

/**
 * club : { id, nom, sigle, ville, couleurs, prestige, centreFormation, reels: ['Nom|POSTE|PAYS', …] }
 * opts : { base, notables, taille, pris (Set des noms déjà utilisés) }
 */
export function buildClub(club, { base, notables = {}, taille = 36, pris = new Set() }) {
  const joueurs = [];
  const compte = (pid) => joueurs.filter(j => j.positionId === pid).length;
  for (const line of club.reels ?? []) {
    const [nom, code, natRaw] = line.split('|');
    const nat = natIds.has(natRaw) ? natRaw : 'autre';
    let positionId = POS[code];
    if (code === 'PI') positionId = compte('pilier-gauche') <= compte('pilier-droit') ? 'pilier-gauche' : 'pilier-droit';
    if (code === '3L' && compte('numero-8') === 0 && compte('troisieme-ligne-aile') >= 2 && hash(nom) > 0.6) positionId = 'numero-8';
    const n = notables[nom];
    const r = hash(nom + club.id);
    const age = n?.[1] ?? 21 + Math.floor(r * 12);
    const note = n?.[0] ?? Math.round(base + r * 8 - 4 - (age <= 21 ? 4 : 0));
    pris.add(nom);
    joueurs.push({ nom, positionId, age, nationaliteId: nat, note: Math.max(40, Math.min(95, note)), jiff: nat === 'FR', reel: true });
  }
  const echelle = taille / 36;
  for (const [pid, cible] of Object.entries(CIBLE)) {
    let i = 0;
    while (compte(pid) < Math.max(pid === 'demi-d-ouverture' || pid === 'arriere' || pid === 'numero-8' ? 2 : 2, Math.round(cible * echelle))) {
      const r = hash(`${club.id}${pid}${i}`);
      const nat = r < 0.8 ? 'FR' : ['FJ', 'GE', 'ZA', 'NZ', 'TO', 'AR', 'WS', 'PT'][Math.floor(hash(`${club.id}${pid}${i}nat`) * 8)];
      const age = 19 + Math.floor(hash(`${club.id}${pid}${i}age`) * 14);
      joueurs.push({ nom: nomGenere(`${club.id}${pid}${i}`, nat, pris), positionId: pid, age, nationaliteId: nat,
        note: Math.max(40, Math.round(base - 2 + r * 8 - 4 - (age <= 21 ? 4 : 0))), jiff: nat === 'FR', genere: true });
      i++;
    }
  }
  const { reels, ...meta } = club;
  return { ...meta, joueurs };
}
