import { TOP14 } from './top14.js';
import { PROD2 } from './prod2.js';
import { NATIONALE } from './nationale.js';

TOP14.niveau = 1;
export const LEAGUES = [TOP14, PROD2, NATIONALE];
export const leagueById = (id) => LEAGUES.find(l => l.id === id);

// Tous les clubs, quelle que soit leur division actuelle.
const CLUBS = new Map(LEAGUES.flatMap(l => l.clubs.map(c => [c.id, c])));
const BASE = Object.fromEntries(LEAGUES.map(l => [l.id, l.clubs.map(c => c.id)]));
export const mondeInitial = () => JSON.parse(JSON.stringify(BASE));

let ligueDe = new Map();
/** Applique la composition des divisions de la saison en cours (montées et descentes). null = composition 2026-27. */
export function setMonde(monde) {
  const m = monde ?? BASE;
  ligueDe = new Map();
  for (const l of LEAGUES) {
    l.clubs = (m[l.id] ?? BASE[l.id]).map(id => CLUBS.get(id)).filter(Boolean);
    for (const c of l.clubs) ligueDe.set(c.id, l);
  }
}
setMonde(null);

export const clubById = (id) => CLUBS.get(id);
export const leagueOfClub = (id) => ligueDe.get(id);
export const allClubs = () => [...CLUBS.values()];
