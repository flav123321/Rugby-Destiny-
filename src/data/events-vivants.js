// Événements « vivants » : leurs textes citent tes vrais coéquipiers, tes adversaires, ton classement, ta sélection.
// vars(state, rng) renvoie les noms à insérer, ou null si l'événement ne s'applique pas.
import { clubById, leagueOfClub } from './leagues/index.js';
import { standings } from '../engine/season.js';
import { nationalPool, nomPays } from '../engine/international.js';
import { NOMS } from './nations.js';

const APTE = ['requiertApte'];
const reels = (club) => club.joueurs.filter(j => !j.genere);
function base(s, rng) {
  const club = clubById(s.player.clubId);
  if (!club) return null;
  const league = leagueOfClub(club.id);
  const moi = `${s.player.prenom} ${s.player.nom}`;
  const coeq = club.joueurs.filter(j => j.nom !== moi);
  const parNote = [...coeq].sort((a, b) => b.note - a.note);
  const rival = parNote.find(j => j.positionId === s.player.positionId) ?? parNote[0];
  const star = (reels(club).length ? [...reels(club)] : parNote).sort((a, b) => b.note - a.note).find(j => j.nom !== rival?.nom) ?? parNote[1];
  const autres = league.clubs.filter(c => c.id !== club.id);
  const adv = autres[Math.floor(rng.next() * autres.length)] ?? autres[0];
  const advJ = [...(reels(adv).length ? reels(adv) : adv.joueurs)].sort((a, b) => b.note - a.note)[0];
  const advPoste = [...adv.joueurs].filter(j => j.positionId === s.player.positionId).sort((a, b) => b.note - a.note)[0] ?? advJ;
  const pote = coeq[Math.floor(rng.next() * coeq.length)] ?? coeq[0];
  return { club: club.nom, ville: club.ville, ligue: league.label, rival: rival?.nom, star: star?.nom, adv: adv.nom, advVille: adv.ville,
    advStar: advJ?.nom, advPoste: advPoste?.nom, pote: pote?.nom, pays: nomPays(s.player.nationaliteId) };
}
function rang(s) {
  const r = s.ligue?.results;
  if (!r?.length) return null;
  const t = standings(r);
  return { rang: t.findIndex(x => x.clubId === s.player.clubId) + 1, total: t.length, leader: clubById(t[0].clubId)?.nom };
}
const pro = (f) => (s, rng) => (s.phase === 'pro' ? f(s, rng) : null);
const jeuneNom = (s, rng, k = 0) => { const [p, n] = NOMS[s.player.nationaliteId] ?? NOMS.FR; return `${p[Math.floor(rng.next() * p.length)]} ${n[(Math.floor(rng.next() * n.length) + k) % n.length]}`; };

export const EVENTS_VIVANTS = [
  { id: 'v-rival-poste', phase: 'pro', poids: 5, vars: pro(base),
    texte: (v) => `${v.rival} est ton concurrent direct au poste. Le staff annonce qu'un seul de vous deux sera titulaire ce week-end.`,
    choix: [
      { label: "T'arracher à l'entraînement", effets: { stats: { endurance: 2, mental: 1 }, forme: -4, texteResultat: (v) => `Tu mets ${v.rival} sous pression toute la semaine. Le coach note ton envie.` } },
      { label: (v) => `Travailler avec ${v.rival}`, effets: { stats: { lecture: 2 }, moral: 3, texteResultat: (v) => `${v.rival} te montre ses repères. Une concurrence saine s'installe.` } },
      { label: 'Aller parler au coach', effets: { stats: { leadership: 1 }, texteResultat: 'Il te dit exactement ce qui te manque. Au moins c’est clair.' } },
    ] },
  { id: 'v-star-conseil', phase: 'pro', poids: 4, vars: pro(base),
    texte: (v) => `Après l'entraînement, ${v.star} te prend à part : « Tu as le niveau, mais tu dois être plus régulier. »`,
    choix: [
      { label: 'Lui demander de bosser ensemble', effets: { stats: { lecture: 2, mental: 2 }, texteResultat: (v) => `${v.star} te consacre une séance par semaine. Énorme.` } },
      { label: 'Le remercier et appliquer seul', effets: { stats: { mental: 2 }, texteResultat: 'Tu travailles ta constance en silence.' } },
      { label: 'Mal le prendre', effets: { moral: -3, texteResultat: (v) => `${v.star} hausse les épaules. Ambiance froide.` } },
    ] },
  { id: 'v-duel-adverse', phase: 'pro', poids: 4, tags: APTE, vars: pro(base),
    texte: (v) => `Ce week-end, ${v.club} reçoit ${v.adv}. Face à toi : ${v.advPoste}, l'un des meilleurs à ton poste. La presse parle d'un duel.`,
    choix: [
      { label: 'Le défier physiquement', effets: { stats: { puissance: 2, plaquage: 1 }, moral: 3, texteResultat: (v) => `Premier contact, ${v.advPoste} recule. Tu as gagné le duel.` } },
      { label: 'Le neutraliser par le placement', effets: { stats: { lecture: 3 }, texteResultat: (v) => `${v.advPoste} ne touche presque pas de ballons. Travail de l'ombre parfait.` } },
      { label: 'Ignorer la presse', effets: { stats: { mental: 2 }, texteResultat: 'Tu joues ton match, sans te mettre la pression.' } },
    ] },
  { id: 'v-offre-adverse', phase: 'pro', periode: 'printemps', poids: 3, vars: pro(base),
    texte: (v) => `${v.adv} te contacte discrètement : le club voudrait t'attirer la saison prochaine.`,
    choix: [
      { label: "Écouter l'offre", effets: { moral: 2, flags: ['contact-transfert'], texteResultat: (v) => `${v.adv} te fait rêver. Ton agent garde le contact.` } },
      { label: (v) => `Rester fidèle à ${v.club}`, effets: { moral: 4, stats: { mental: 1 }, texteResultat: (v) => `Les dirigeants de ${v.club} apprennent ta fidélité. Ils s'en souviendront.` } },
      { label: "Te servir de l'offre pour négocier", effets: { moral: 1, flags: ['revalorise'], texteResultat: 'Ton club s’aligne pour te garder.' } },
    ] },
  { id: 'v-pote-part', phase: 'pro', periode: 'ete', poids: 3, vars: pro(base),
    texte: (v) => `${v.pote}, avec qui tu t'entends le mieux au club, t'annonce qu'il pourrait partir à ${v.adv}.`,
    choix: [
      { label: 'Le convaincre de rester', effets: { stats: { leadership: 2 }, moral: 2, texteResultat: (v) => `${v.pote} hésite… et finit par prolonger. Le vestiaire t'en est reconnaissant.` } },
      { label: 'L’encourager à partir', effets: { moral: -1, texteResultat: (v) => `Tu lui souhaites le meilleur. Vous vous recroiserez face à ${v.adv}.` } },
      { label: 'Organiser une soirée d’adieu', effets: { moral: 5, forme: -3, texteResultat: 'Soirée mémorable. Une amitié pour la vie.' } },
    ] },
  { id: 'v-classement-tete', phase: 'pro', poids: 4, vars: pro((s, rng) => { const r = rang(s); const b = base(s, rng); return r && r.rang <= 2 ? { ...b, ...r } : null; }),
    texte: (v) => `${v.club} est ${v.rang === 1 ? 'en tête' : '2e'} du ${v.ligue}. Toute la ville de ${v.ville} rêve du titre.`,
    choix: [
      { label: 'Garder la tête froide', effets: { stats: { mental: 2 }, texteResultat: 'Un match après l’autre. Le discours du vestiaire.' } },
      { label: 'Profiter de l’euphorie', effets: { moral: 6, texteResultat: (v) => `Les rues de ${v.ville} sont aux couleurs du club. Tu adores.` } },
      { label: 'Pousser les jeunes à garder le rythme', effets: { stats: { leadership: 3 }, texteResultat: 'Tu deviens une voix qui compte.' } },
    ] },
  { id: 'v-classement-bas', phase: 'pro', poids: 4, vars: pro((s, rng) => { const r = rang(s); const b = base(s, rng); return r && r.rang >= r.total - 2 ? { ...b, ...r } : null; }),
    texte: (v) => `${v.club} est ${v.rang}e sur ${v.total}. La menace de la relégation plane et le président parle de « match de la survie ».`,
    choix: [
      { label: 'Prendre la parole dans le vestiaire', effets: { stats: { leadership: 3 }, moral: -1, texteResultat: 'Ton discours réveille le groupe.' } },
      { label: 'Montrer l’exemple au plaquage', effets: { stats: { plaquage: 2, mental: 1 }, texteResultat: 'Tu fais 18 plaquages. Le public se lève pour toi.' } },
      { label: 'Penser à ton avenir', effets: { moral: -3, flags: ['transfert-envisage'], texteResultat: 'Ton agent prépare un plan B en cas de descente.' } },
    ] },
  { id: 'v-leader-adverse', phase: 'pro', poids: 3, tags: APTE, vars: pro((s, rng) => { const r = rang(s); const b = base(s, rng); return r && r.leader !== b.club ? { ...b, ...r } : null; }),
    texte: (v) => `Déplacement chez le leader, ${v.leader}. Personne ne vous donne la moindre chance.`,
    choix: [
      { label: 'Jouer sans complexe', effets: { stats: { vitesse: 1 }, moral: 4, texteResultat: 'Vous tenez tête au leader. Le groupe gagne en confiance.' } },
      { label: 'Défendre jusqu’au bout', effets: { stats: { plaquage: 2 }, forme: -4, texteResultat: 'Un mur. Vous ramenez le bonus défensif.' } },
      { label: 'Préserver tes forces', effets: { forme: 5, texteResultat: 'Tu gères. Pas de blessure, c’est déjà ça.' } },
    ] },
  { id: 'v-chambrage', phase: 'tous', poids: 3, vars: (s, rng) => (s.phase === 'pro' ? base(s, rng) : null),
    texte: (v) => `${v.pote} raconte au vestiaire ta dernière boulette à l'entraînement. Tout le monde éclate de rire.`,
    choix: [
      { label: 'Rire avec eux', effets: { moral: 4, texteResultat: 'Tu fais partie de la bande.' } },
      { label: (v) => `Te venger sur ${v.pote} au prochain exercice`, effets: { stats: { plaquage: 1 }, moral: 3, texteResultat: (v) => `Plaquage propre sur ${v.pote}. Le vestiaire hurle.` } },
      { label: 'Faire la tête', effets: { moral: -3, texteResultat: 'Mauvaise ambiance. Ça passera.' } },
    ] },
  { id: 'v-joueur-du-mois', phase: 'pro', poids: 3, vars: pro(base), condition: (s) => (s.saisonStats?.notes ?? []).length >= 3 && s.saisonStats.notes.slice(-3).every(n => n >= 6.5),
    texte: (v) => `Les supporters de ${v.club} t'ont élu joueur du mois.`,
    choix: [
      { label: 'Remercier le public sur le terrain', effets: { moral: 6, flags: ['populaire'], texteResultat: 'Ovation au match suivant.' } },
      { label: 'Dédier le trophée à tes coéquipiers', effets: { stats: { leadership: 2 }, moral: 4, texteResultat: 'Le vestiaire apprécie ton humilité.' } },
      { label: 'Rester concentré', effets: { stats: { mental: 2 }, texteResultat: 'Un trophée de plus dans le placard. Au travail.' } },
    ] },
  { id: 'v-presse-selection', phase: 'pro', poids: 3, vars: pro((s, rng) => {
      const b = base(s, rng);
      const rival = nationalPool(s.player.nationaliteId).filter(j => j.positionId === s.player.positionId && j.nom !== `${s.player.prenom} ${s.player.nom}`)[0];
      return rival ? { ...b, rivalNat: rival.nom } : null; }),
    texte: (v) => `Un journaliste te demande si tu peux un jour prendre la place de ${v.rivalNat} avec ${v.pays}.`,
    choix: [
      { label: '« Je travaille pour ça »', effets: { stats: { mental: 2 }, moral: 2, texteResultat: 'Ta phrase fait le tour des réseaux.' } },
      { label: (v) => `« ${v.rivalNat} est un modèle »`, effets: { moral: 1, stats: { lecture: 1 }, texteResultat: 'Réponse élégante, très appréciée.' } },
      { label: 'Ne pas répondre', effets: { texteResultat: 'Pas de polémique.' } },
    ] },
  { id: 'v-rival-blesse', phase: 'pro', poids: 3, tags: APTE, vars: pro(base),
    texte: (v) => `${v.rival} se blesse à l'entraînement. Le coach te donne sa place pour les trois prochains matchs.`,
    choix: [
      { label: 'Saisir ta chance', effets: { stats: { mental: 2 }, moral: 5, texteResultat: 'Trois gros matchs. Le coach a un vrai dilemme maintenant.' } },
      { label: (v) => `Prendre des nouvelles de ${v.rival}`, effets: { moral: 3, stats: { leadership: 1 }, texteResultat: (v) => `${v.rival} est touché par ton geste.` } },
      { label: 'Jouer prudemment', effets: { stats: { lecture: 1 }, texteResultat: 'Sans faute, mais sans éclat.' } },
    ] },
  { id: 'v-revanche', phase: 'pro', poids: 3, tags: APTE, vars: pro(base),
    texte: (v) => `Match retour contre ${v.adv}. À l'aller, ${v.advStar} avait marqué deux essais et chambré ton équipe.`,
    choix: [
      { label: 'Jouer la revanche', effets: { stats: { plaquage: 2 }, moral: 4, texteResultat: (v) => `Tu cibles ${v.advStar} toute la soirée. Il ne marque pas.` } },
      { label: 'Rester froid', effets: { stats: { mental: 2 }, texteResultat: 'Pas d’émotion, juste l’efficacité.' } },
      { label: 'Répondre sur les réseaux avant le match', effets: { moral: -2, flags: ['reputation-'], texteResultat: 'Ça fait polémique. Le coach n’apprécie pas.' } },
    ] },
  { id: 'v-pret-rentrer', phase: 'pro', poids: 4, condition: (s) => !!s.pret, vars: pro(base),
    texte: (v) => `En prêt à ${v.club}, tu joues chaque week-end en ${v.ligue}. Ton club formateur suit tes matchs de près.`,
    choix: [
      { label: 'Tout donner pour revenir plus fort', effets: { stats: { mental: 2, endurance: 1 }, texteResultat: 'Tes stats parlent pour toi.' } },
      { label: (v) => `T'attacher à ${v.club}`, effets: { moral: 4, stats: { leadership: 1 }, texteResultat: (v) => `${v.ville} t'adopte. Tu pourrais y rester.` } },
      { label: 'Appeler ton manager formateur', effets: { stats: { lecture: 1 }, texteResultat: 'Il te dit ce qu’il attend à ton retour.' } },
    ] },
  { id: 'v-ville', phase: 'pro', periode: 'presaison', poids: 3, vars: pro(base), condition: (s) => s.player.historique.at(-1)?.club && s.player.historique.at(-1).club !== clubById(s.player.clubId)?.nom,
    texte: (v) => `Tu découvres ${v.ville}, ta nouvelle ville. Tout est à reconstruire : appart, habitudes, amis.`,
    choix: [
      { label: 'T’installer en centre-ville', effets: { moral: 5, texteResultat: (v) => `${v.ville} te plaît tout de suite.` } },
      { label: 'Vivre près du centre d’entraînement', effets: { forme: 5, stats: { endurance: 1 }, texteResultat: 'Tu ne perds pas une minute.' } },
      { label: (v) => `Te faire guider par ${v.pote}`, effets: { moral: 4, stats: { leadership: 1 }, texteResultat: (v) => `${v.pote} te présente à tout le monde.` } },
    ] },
  { id: 'v-coloc', phase: 'pro', poids: 2, vars: pro(base), condition: (s) => s.player.age <= 24,
    texte: (v) => `${v.pote} cherche un colocataire et te propose de partager son appartement.`,
    choix: [
      { label: 'Accepter', effets: { moral: 5, forme: -2, texteResultat: 'Soirées jeux vidéo et pâtes à 23 h. La belle vie.' } },
      { label: 'Préférer vivre seul', effets: { forme: 3, texteResultat: 'Calme et récupération.' } },
      { label: 'Proposer de vivre avec deux autres jeunes', effets: { moral: 6, stats: { leadership: 1 }, texteResultat: 'La « maison des jeunes » devient célèbre au club.' } },
    ] },
  { id: 'v-centre-pote', phase: 'centre', poids: 5, vars: (s, rng) => ({ jeune: jeuneNom(s, rng), jeune2: jeuneNom(s, rng, 3) }),
    texte: (v) => `${v.jeune}, ton meilleur ami au centre, doute. Il pense arrêter le rugby et rentrer chez lui.`,
    choix: [
      { label: 'Le convaincre de rester', effets: { stats: { leadership: 2 }, moral: 3, texteResultat: (v) => `${v.jeune} reste. Il te devra beaucoup.` } },
      { label: 'Respecter son choix', effets: { moral: -2, texteResultat: (v) => `${v.jeune} part. Le centre paraît plus vide.` } },
      { label: (v) => `Monter un groupe de soutien avec ${v.jeune2}`, effets: { moral: 4, stats: { leadership: 1 }, texteResultat: 'Plusieurs jeunes doutaient. Vous vous serrez les coudes.' } },
    ] },
  { id: 'v-centre-rival', phase: 'centre', poids: 5, vars: (s, rng) => ({ jeune: jeuneNom(s, rng, 1) }),
    texte: (v) => `${v.jeune} joue au même poste que toi et vient d'être surclassé chez les Espoirs. Tout le monde compare vos parcours.`,
    choix: [
      { label: 'Doubler les séances', effets: { stats: { endurance: 2, puissance: 1 }, forme: -4, texteResultat: 'Tu ne lâches rien.' } },
      { label: (v) => `Demander conseil à ${v.jeune}`, effets: { stats: { lecture: 2 }, moral: 2, texteResultat: (v) => `${v.jeune} t'aide volontiers. Une belle rivalité.` } },
      { label: 'T’en moquer', effets: { stats: { mental: 2 }, texteResultat: 'Chacun son chemin.' } },
    ] },
  { id: 'v-centre-pros', phase: 'centre', poids: 4, tags: APTE, condition: (s) => s.player.age >= 17, vars: (s, rng) => { const b = base({ ...s, phase: 'pro' }, rng); return b; },
    texte: (v) => `${v.star}, le joueur star de ${v.club}, assiste à ton match chez les jeunes et vient te féliciter.`,
    choix: [
      { label: 'Lui demander des conseils', effets: { stats: { lecture: 2, mental: 1 }, moral: 4, texteResultat: (v) => `${v.star} te donne son numéro. Incroyable.` } },
      { label: 'Rester humble', effets: { stats: { mental: 2 }, texteResultat: 'Un simple merci. Il apprécie.' } },
      { label: 'Poster la photo partout', effets: { moral: 6, flags: ['populaire'], texteResultat: 'Ta photo avec lui fait le tour du club.' } },
    ] },
  { id: 'v-centre-adverse', phase: 'centre', poids: 4, tags: APTE, vars: (s, rng) => base({ ...s, phase: 'pro' }, rng),
    texte: (v) => `Match des jeunes contre ${v.adv}. Leur centre de formation est réputé, et leur meilleur jeune est annoncé comme le futur crack.`,
    choix: [
      { label: 'Le marquer de près', effets: { stats: { plaquage: 3 }, texteResultat: 'Tu l’éteins complètement. Les recruteurs notent ton nom.' } },
      { label: 'Jouer ton jeu', effets: { stats: { vitesse: 1, passe: 1 }, moral: 2, texteResultat: 'Tu fais ton match, sans te soucier de lui.' } },
      { label: 'Vouloir lui voler la vedette', effets: { stats: { vitesse: 2 }, moral: 1, texteResultat: 'Un essai… et deux fautes. Match fou.' } },
    ] },
  { id: 'v-selection-u20-pays', phase: 'tous', poids: 3, condition: (s) => s.player.age >= 17 && s.player.age <= 20, vars: (s) => ({ pays: nomPays(s.player.nationaliteId) }),
    texte: (v) => `Le staff des moins de 20 ans de ${v.pays} t'envoie un programme physique à suivre pendant les vacances.`,
    choix: [
      { label: 'Le suivre à la lettre', effets: { stats: { endurance: 2, puissance: 1 }, moral: -1, texteResultat: 'Tu arrives au stage en pleine forme.' } },
      { label: 'L’adapter à ton rythme', effets: { stats: { endurance: 1 }, forme: 4, texteResultat: 'Un bon compromis.' } },
      { label: 'L’ignorer', effets: { moral: 2, texteResultat: 'Le staff le remarquera.' } },
    ] },
];
