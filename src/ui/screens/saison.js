import { esc, crest, clubNom, ligueNom } from '../common.js';
import { standings } from '../../engine/season.js';
import { nomPays } from '../../engine/international.js';

export function renderSaisonTab(s) {
  if (!s.ligue?.results.length) return '<p class="muted">Le championnat n’a pas encore commencé.</p>';
  const t = standings(s.ligue.results);
  return `<p class="muted">${esc(ligueNom(s.player.clubId))} · après ${s.ligue.journee} journée${s.ligue.journee > 1 ? 's' : ''}</p><div class="scroll"><table>
    <tr><th>#</th><th>Club</th><th>J</th><th>G</th><th>Diff</th><th>Pts</th></tr>
    ${t.map((r, i) => `<tr class="${r.clubId === s.player.clubId ? 'me' : ''}"><td>${i + 1}</td><td><span class="club-row">${crest(r.clubId, 20)} ${esc(clubNom(r.clubId))}</span></td>
      <td>${r.j}</td><td>${r.g}</td><td>${r.pf - r.pc > 0 ? '+' : ''}${r.pf - r.pc}</td><td><b>${r.pts}</b></td></tr>`).join('')}
  </table></div>`;
}

const moyenne = (n) => n?.length ? (n.reduce((a, b) => a + b, 0) / n.length).toFixed(1) : '–';

function blocStats(titre, st) {
  return `<div class="card"><h3>${titre}</h3><div class="grid g3" style="text-align:center">
    <div><b>${st.matchs}</b><br><span class="muted">matchs</span></div>
    <div><b>${st.titularisations}</b><br><span class="muted">titularisations</span></div>
    <div><b>${st.essais}</b><br><span class="muted">essais</span></div>
    <div><b>${st.minutes}</b><br><span class="muted">minutes</span></div>
    <div><b>${st.points}</b><br><span class="muted">points</span></div>
    <div><b>${moyenne(st.notes)}</b><br><span class="muted">note moy.</span></div></div></div>`;
}

export function renderMatchsRecents(s) {
  const st = s.saisonStats;
  const niveau = s.phase === 'centre' ? 'Ma saison' : ligueNom(s.player.clubId) + (s.pret ? ' (prêt)' : '');
  const esp = st.espoirs;
  const resume = blocStats(niveau, st) + (s.phase === 'pro' && esp?.matchs ? blocStats('Espoirs', esp) : '')
    + (s.phase === 'centre' && st.top14?.matchs ? blocStats(`${ligueNom(s.player.clubId)} (avec les pros)`, st.top14) : '');
  const inter = (st.inter?.matchs ? blocStats('Sélection nationale', st.inter) : '') + (st.u20?.matchs ? blocStats('Équipe nationale U20', st.u20) : '') + renderInter(s);
  if (s.phase === 'centre') return resume + inter + renderListeJeunes(s);
  return renderListe(s, resume + inter);
}

function renderInter(s) {
  const w = s.derniereFenetre;
  const comps = (s.interSaison ?? []);
  if (!comps.length) return '';
  const lignes = comps.map(c => `<div>${c.selectionne ? '✅' : '➖'} <b>${esc(c.competition)}</b> : ${esc(c.resultat)}${c.selectionne ? '' : ' <span class="muted">(non sélectionné)</span>'}</div>`).join('');
  const matchs = w?.selectionne ? w.matchs.map(m => {
    const p = m.perf;
    const perf = p ? `${p.statut === 'titulaire' ? 'Titulaire' : 'Remplaçant'} · ${p.minutes}′ · note <b>${p.note}</b>${p.essais ? ` · ${p.essais} essai${p.essais > 1 ? 's' : ''}` : ''}` : '<span class="muted">Non retenu sur ce match</span>';
    return `<div class="card">${m.tour ? `<span class="muted">${esc(m.tour)}</span> · ` : ''}${m.gagne ? '✅' : m.nul ? '🟰' : '❌'} ${m.domicile ? 'contre' : 'chez'} ${esc(nomPays(m.adversaire))} <b>${m.score}</b><br>${perf}</div>`;
  }).join('') : '';
  return `<h3>International · cette saison</h3><div class="card">${lignes}</div>${matchs ? `<h3>${esc(w.competition)}</h3>${matchs}` : ''}`;
}

function renderListeJeunes(s) {
  const matchs = (s.matchsJeunes ?? []).slice(-8).reverse();
  if (!matchs.length) return '<p class="muted">Aucun match joué pour l’instant.</p>';
  return `<h3>Mes derniers matchs</h3>${matchs.map(m => {
    const p = m.perf;
    const perf = p.statut === 'banc' ? '<span class="muted">Resté sur le banc</span>'
      : `${p.statut === 'titulaire' ? 'Titulaire' : 'Remplaçant'} · ${p.minutes}′ · note <b>${p.note}</b>${p.essais ? ' · 1 essai' : ''}`;
    const res = m.gagne ? '✅' : '❌';
    return `<div class="card"><span class="muted">${esc(m.categorie)}</span> · ${res} ${m.domicile ? 'contre' : 'chez'} ${esc(m.adversaire)} <b>${m.score}</b><br>${perf}</div>`;
  }).join('')}`;
}

function renderListe(s, resume) {
  const matchs = (s.ligue?.joueurMatchs ?? []).slice(-6).reverse();
  if (!matchs.length) return resume;
  return resume + `<h3>Derniers matchs du club</h3>${matchs.map(m => {
    const p = m.perf;
    const e = m.espoirs;
    const perf = !p ? (e ? `<span class="muted">Non retenu en ${esc(ligueNom(s.player.clubId))}</span> · avec les Espoirs : ${e.statut === 'titulaire' ? 'titulaire' : 'remplaçant'}, ${e.minutes}′, note <b>${e.note}</b>${e.essais ? ' · 1 essai' : ''}` : '<span class="muted">Non retenu</span>')
      : `${p.statut === 'titulaire' ? 'Titulaire' : 'Remplaçant'} · ${p.minutes}′ · note <b>${p.note}</b>${p.essais ? ` · ${p.essais} essai${p.essais > 1 ? 's' : ''}` : ''}${p.points && !p.essais ? ` · ${p.points} pts` : ''}`;
    return `<div class="card"><span class="muted">J${m.journee}</span> ${esc(clubNom(m.home))} <b>${m.score}</b> ${esc(clubNom(m.away))}<br>${perf}</div>`;
  }).join('')}`;
}
