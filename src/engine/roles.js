import { overall } from './rating.js';

/** Rôle proposé à un joueur dans un club, selon les vrais joueurs à son poste. */
export function roleFor(club, player) {
  const ovr = overall(player.stats, player.positionId);
  const n = club.joueurs.filter(j => j.positionId === player.positionId && j.note > ovr).length;
  return n === 0 ? 'titulaire' : n <= 2 ? 'rotation' : 'espoir';
}
