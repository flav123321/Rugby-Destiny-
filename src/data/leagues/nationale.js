// Nationale 2026-27 — 14 clubs (liste reconstituée à partir de la saison 2025-26, des promotions de Narbonne et Nice
// et des relégations de Mont-de-Marsan et Carcassonne ; à vérifier). Joueurs générés.
import { buildClub } from './build.js';

const RAW = [
  ['montdemarsan', 'Stade Montois', 'SM', 'Mont-de-Marsan', ['#ffd200', '#000000'], 2],
  ['carcassonne', 'US Carcassonne', 'USC', 'Carcassonne', ['#ffd200', '#00205b'], 2],
  ['perigueux', 'CA Périgueux', 'CAP', 'Périgueux', ['#00843d', '#ffffff'], 1],
  ['bourgoin', 'CS Bourgoin-Jallieu', 'CSBJ', 'Bourgoin-Jallieu', ['#5b2a86', '#ffffff'], 1],
  ['niort', 'Niort Rugby Club', 'NRC', 'Niort', ['#1d4f9c', '#ffffff'], 1],
  ['marcq', 'Olympique Marcquois Rugby', 'OMR', 'Marcq-en-Barœul', ['#c8102e', '#ffffff'], 1],
  ['rennes', 'Rennes Étudiants Club', 'REC', 'Rennes', ['#111111', '#c8102e'], 1],
  ['rouen', 'Rouen Normandie Rugby', 'RNR', 'Rouen', ['#c8102e', '#ffd200'], 2],
  ['suresnes', 'RC Suresnes', 'RCS', 'Suresnes', ['#1e88e5', '#ffffff'], 1],
  ['massy', 'RC Massy Essonne', 'RCME', 'Massy', ['#c8102e', '#111111'], 1],
  ['chambery', 'SO Chambéry', 'SOC', 'Chambéry', ['#111111', '#ffffff'], 1],
  ['albi', 'SC Albi', 'SCA', 'Albi', ['#ffd200', '#111111'], 1],
  ['tarbes', 'Tarbes Pyrénées Rugby', 'TPR', 'Tarbes', ['#c8102e', '#ffffff'], 1],
  ['bourg', 'US Bressane', 'USB', 'Bourg-en-Bresse', ['#00843d', '#c8102e'], 1],
].map(([id, nom, sigle, ville, couleurs, prestige]) => ({ id, nom, sigle, ville, couleurs, prestige, centreFormation: 1, reels: [] }));

const pris = new Set();
export const NATIONALE = { id: 'nationale', label: 'Nationale', pays: 'FR', niveau: 3, saison: '2026-27',
  clubs: RAW.map(c => buildClub(c, { base: c.prestige >= 2 ? 59 : 57, taille: 32, pris })) };
