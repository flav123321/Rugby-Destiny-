# Rugby Carrière

Jeu de carrière de rugbyman (Top 14 2026-27), publié avec GitHub Pages depuis la racine de `main`. Pas d'étape de build : les fichiers publiés sont le code source.

- Tests : `npm test` (Node 20+, aucune dépendance).
- À chaque mise à jour publiée : augmente `version` dans `package.json` ET le nom du cache dans `sw.js` (un test le vérifie), sinon l'iPhone garde l'ancienne version.
- Conception et plans : `docs/`.
- Réponds à l'utilisateur en français, sur un ton simple : il joue sur iPhone, sans ordinateur.
