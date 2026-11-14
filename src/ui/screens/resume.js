import { esc, crest, clubNom, header, historyTable } from '../common.js';

const ROLES = { titulaire: 'Titulaire', rotation: 'Rotation', espoir: 'Espoir' };

function bilanCard(r) {
  return r ? `<div class="card"><h3>Bilan ${esc(r.saison)}</h3>
    <p><b>${esc(r.club)}</b> · ${esc(r.niveau ?? '')} · ${r.age} ans</p>
    <p>${r.niveau && !r.categorie ? `<b>${esc(r.niveau)}</b> : ` : ''}${r.matchs} matchs · ${r.titularisations} titularisations · ${r.minutes} min · ${r.essais} essai${r.essais > 1 ? 's' : ''} · ${r.points} pts · note moyenne ${r.noteMoyenne ?? '–'}</p>
    ${r.espoirs ? `<p><b>Espoirs</b> : ${r.espoirs.matchs} matchs · ${r.espoirs.titularisations} titularisations · ${r.espoirs.minutes} min · ${r.espoirs.essais} essai${r.espoirs.essais > 1 ? 's' : ''} · note moyenne ${r.espoirs.noteMoyenne ?? '–'}</p>` : ''}
    ${r.champion ? `<p class="muted">Champion de France : ${esc(r.champion)} (${esc(r.finale)}) · relégué : ${esc(r.relegue)}${r.classementClub ? ` · ton club : ${r.classementClub}e` : ''}</p>` : ''}
    ${r.top14?.matchs ? `<p><b>Top 14</b> (appelé avec les pros) : ${r.top14.matchs} matchs · ${r.top14.titularisations} titularisations · ${r.top14.essais} essai${r.top14.essais > 1 ? 's' : ''}</p>` : ''}
    ${r.championAvecLui ? '<p>🏆 <b>Tu es champion de France !</b></p>' : ''}
    ${r.inter ? `<p><b>Sélection nationale</b> : ${r.inter.matchs} matchs · ${r.inter.essais} essai${r.inter.essais > 1 ? 's' : ''} · note moyenne ${r.inter.noteMoyenne ?? '–'}</p>` : ''}
    ${r.u20 ? `<p><b>U20</b> : ${r.u20.matchs} matchs · ${r.u20.essais} essai${r.u20.essais > 1 ? 's' : ''}</p>` : ''}
    ${(r.competitions ?? []).filter(c => c.selectionne || c.niveau === 'A').map(c => `<p class="muted">${c.selectionne ? '🌍' : '📺'} ${esc(c.competition)} : ${esc(c.resultat)}</p>`).join('')}
    ${(r.distinctions ?? []).map(d => `<p>🏅 <b>${esc(d)}</b></p>`).join('')}</div>` : '';
}

export function renderBilan(ui) {
  const s = ui.career;
  return `${header(s)}<h1>Fin de saison</h1>${bilanCard(s.dernierResume)}
    <button class="btn primary" data-action="avancer">Saison suivante</button>`;
}

export function renderOffres(ui) {
  const s = ui.career;
  const bilan = bilanCard(s.dernierResume);
  const anticipe = s.offresContrat.some(o => o.anticipe);
  const titre = anticipe ? 'Le club veut te faire signer pro !' : s.player.age <= 19 && s.player.historique.every(h => h.categorie) ? 'Fin du centre de formation' : 'Ton avenir';
  return `${header(s)}<h1>${titre}</h1>${bilan}<h2>Offres</h2>
    ${s.offresContrat.map((o, i) => {
      if (o.type === 'centre') return `<button class="btn" data-action="offre" data-v="${i}">Finir ta formation au centre<small>Une dernière saison chez les jeunes avant de passer pro</small></button>`;
      if (o.type === 'liberation') return `<button class="btn danger" data-action="offre" data-v="${i}">Le club ne te garde pas<small>Fin de l’aventure (les autres divisions arrivent bientôt)</small></button>`;
      if (o.type === 'pret') return `<button class="btn" data-action="offre" data-v="${i}">Prêt d’un an en ${esc(o.division)}<small>Rôle attendu : ${ROLES[o.role] ?? ''} · retour ensuite à ${esc(clubNom(o.clubId))}</small></button>`;
      return `<button class="btn" data-action="offre" data-v="${i}"><span class="club-row">${crest(o.clubId, 36)}<span><b>${esc(clubNom(o.clubId))}</b>
        <small>${o.anticipe ? '⚡ Contrat pro anticipé · ' : ''}Contrat pro de ${o.duree} an${o.duree > 1 ? 's' : ''} · rôle : ${ROLES[o.role] ?? o.role}</small></span></span></button>`;
    }).join('')}
    ${s.player.age >= 30 ? '<button class="btn danger" data-action="retraite">Prendre ma retraite</button>' : ''}`;
}

export function renderFin(ui) {
  const s = ui.career; const h = s.player.historique.filter(x => !x.categorie);
  const tot = (k) => h.reduce((a, x) => a + (x[k] ?? 0), 0);
  const titres = h.filter(x => x.championAvecLui).length;
  return `${header(s)}<h1>Fin de carrière</h1>
    <div class="card"><p>${esc(s.journal.at(-1) ?? '')}</p>
    <p><b>${tot('matchs')}</b> matchs pros · <b>${tot('essais')}</b> essais · <b>${tot('points')}</b> points · <b>${titres}</b> Bouclier${titres > 1 ? 's' : ''} de Brennus</p></div>
    ${historyTable(s.player.historique)}
    <button class="btn primary" data-action="nouvelle">Nouvelle carrière</button>`;
}
