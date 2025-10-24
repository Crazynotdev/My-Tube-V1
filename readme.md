```markdown
# My-Tube — UI + Backend complet (local)

Ce dépôt contient une interface web (frontend) et un backend Node.js minimal pour rechercher des vidéos YouTube et streamer l'audio côté serveur.

Important — légal
- Ce projet est fourni à titre éducatif. Respectez les politiques et droits d'auteur des contenus que vous traitez.
- Télécharger ou redistribuer du contenu protégé sans autorisation peut être illégal. Utilisez ce code uniquement pour des contenus où vous avez les droits ou pour des tests locaux.

Prérequis
- Node.js 16+ et npm
- (Optionnel) ffmpeg si vous voulez transcoder les flux (non requis pour le streaming basique)

Installation
1. Clone le repo et place-toi à la racine :
   git clone <ton-repo>
   cd My-Tube

2. Installe les dépendances du serveur :
   cd server
   npm install

3. Lance le serveur en local :
   npm start
   (le serveur écoute par défaut sur http://localhost:3000)

Utilisation
- Ouvre http://localhost:3000 dans ton navigateur.
- Recherche un titre ou un artiste. Le serveur utilise une recherche publique (scraping via ytsr).
- Clique sur Lecture pour écouter l'audio en streaming.
- Clique sur Télécharger pour obtenir un fichier audio (serveur mettra en Content-Disposition: attachment).

Structure
- index.html — frontend (dans la racine public servie par Express)
- assets/ — CSS et JS
- server/ — backend Express
  - server/server.js — API: /api/search et /api/stream
  - server/package.json — dépendances et scripts

Endpoints backend
- GET /api/search?q=terme
  Renvoie JSON: [{ id, title, duration, thumbnail }, ...]
- GET /api/stream?videoId=ID[&download=1]
  Stream audio de la vidéo. Si download=1, le header Content-Disposition force le téléchargement.

Sécurité & production
- Ajoute un proxy inverse sécurisé, limite les requêtes (rate limiting) et surveille l'utilisation.
- En production, pense à utiliser un stock temporaire ou transcodage avec ffmpeg si besoin.
- Ne déploie pas un service public qui permet le téléchargement massif de contenus protégés.

Améliorations possibles
- Pagination & infinite scroll
- Meilleure gestion des formats audio et fallback (m4a/webm)
- Cache des métadonnées/transcodage
- Authentification / quotas par utilisateur
- Ajout d'une page légale (CGU, DMCA, confidentialité)

Si tu veux que je pousse ces fichiers dans la branche `improve-ui` et crée la PR automatiquement, dis-le et je m'en occupe.
```
