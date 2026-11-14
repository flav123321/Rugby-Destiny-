import { TOP14 } from './top14.js';
import { PROD2 } from './prod2.js';
import { NATIONALE } from './nationale.js';

TOP14.niveau = 1;
export const LEAGUES = [TOP14, PROD2, NATIONALE];
export const leagueById = (id) => LEAGUES.find(l => l.id === id);
const index = new Map();
for (const l of LEAGUES) for (const c of l.clubs) index.set(c.id, { club: c, league: l });
export const clubById = (id) => index.get(id)?.club;
export const leagueOfClub = (id) => index.get(id)?.league;
export const allClubs = () => LEAGUES.flatMap(l => l.clubs);
