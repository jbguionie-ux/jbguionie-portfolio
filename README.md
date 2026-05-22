# jbguionie.fr — Portfolio voix off

Site portfolio personnel — Jean-Baptiste Guionie, comédien voix off.

---

## 📋 Vue d'ensemble

**Stack technique :**
- Site statique HTML / CSS / JavaScript
- Hébergement : **Netlify** (gratuit)
- Code : **GitHub** (gratuit)
- Back-office : **Decap CMS** sur `/admin` (gratuit)
- Domaine : **jbguionie.fr** (~12€/an)

**Coût total : ~12€/an** (juste le nom de domaine).

---

## 🚀 Mise en ligne — première installation

### Étape 1 — Créer un compte GitHub
1. Aller sur https://github.com et cliquer sur **Sign up**.
2. Choisir un nom d'utilisateur (ex : `jbguionie`).
3. Confirmer l'email.

### Étape 2 — Créer un nouveau dépôt GitHub
1. Cliquer sur **+** en haut à droite puis **New repository**.
2. Nommer le dépôt : `jbguionie-portfolio`.
3. Le laisser **Public** (Netlify pourra le lire gratuitement).
4. Ne **PAS** cocher "Initialize with README".
5. Cliquer sur **Create repository**.

### Étape 3 — Uploader le code dans GitHub
**Option A — Depuis l'interface web (le plus simple) :**
1. Sur la page du dépôt fraîchement créé, cliquer **uploading an existing file**.
2. Glisser-déposer **tous les fichiers et dossiers** du projet.
3. Tout en bas, cliquer **Commit changes**.

**Option B — Avec GitHub Desktop (recommandé si vous comptez mettre à jour régulièrement) :**
1. Télécharger **GitHub Desktop** : https://desktop.github.com
2. Se connecter avec son compte GitHub.
3. Faire **File → Clone repository** et choisir le dépôt créé.
4. Copier tous les fichiers du projet dans le dossier cloné.
5. GitHub Desktop détecte les modifications. Cliquer **Commit to main**, puis **Push origin**.

### Étape 4 — Créer un compte Netlify
1. Aller sur https://app.netlify.com et cliquer **Sign up with GitHub**.
2. Autoriser Netlify à accéder à GitHub.

### Étape 5 — Déployer le site
1. Sur Netlify, cliquer **Add new site → Import an existing project**.
2. Choisir **GitHub** comme source.
3. Sélectionner le dépôt `jbguionie-portfolio`.
4. Laisser les options par défaut (Netlify lit le fichier `netlify.toml` automatiquement).
5. Cliquer **Deploy site**.
6. Patienter 1 à 2 minutes. Une URL temporaire est générée (ex: `random-name-12345.netlify.app`).

**Le site est en ligne !** Mais il n'a pas encore de domaine personnalisé ni de back-office actif.

### Étape 6 — Activer le back-office (Netlify Identity)
1. Sur Netlify, ouvrir votre site puis aller dans **Site configuration → Identity**.
2. Cliquer **Enable Identity**.
3. Dans **Registration preferences**, choisir **Invite only** (très important : sinon n'importe qui pourrait créer un compte).
4. Dans **Services → Git Gateway**, cliquer **Enable Git Gateway**.
5. Retourner dans **Identity**, cliquer **Invite users**, et entrer votre adresse email.
6. Un email arrive. Cliquer le lien et créer un mot de passe.

### Étape 7 — Connecter le nom de domaine
1. Acheter **jbguionie.fr** sur OVH, Gandi ou Namecheap (~12€/an).
2. Sur Netlify, aller dans **Domain management → Add a domain**.
3. Entrer `jbguionie.fr`.
4. Netlify donne les enregistrements DNS à configurer chez le registrar.
5. Chez le registrar (OVH, Gandi…), configurer les **nameservers** ou les enregistrements **A/CNAME** indiqués par Netlify.
6. Patienter de 1h à 24h pour la propagation DNS.
7. Activer **HTTPS** dans Netlify (gratuit, automatique).

**Tout est en place !**

---

## 📝 Utilisation quotidienne — Ajouter un extrait

### Ajouter un extrait audio

1. Aller sur **https://jbguionie.fr/admin**.
2. Se connecter avec son email + mot de passe Netlify Identity.
3. Dans la barre latérale, cliquer **Extraits audio**.
4. Cliquer **New Extrait**.
5. Remplir les champs :
   - **Titre** : titre de l'extrait. Pour mettre en italique, encadrer avec des étoiles : `Tucson — *« Nouvelle génération »*`
   - **Slug** : identifiant unique (lettres minuscules, tirets). Ex: `tucson-nouvelle-generation`
   - **Client** : Hyundai
   - **Support** : Spot TV / Spot Radio / etc.
   - **Année** : 2026
   - **Type** : sélectionner Publicité, Radio, Billboard, Instit, Doublage ou Livre Audio.
   - **Secteur** : sélectionner Food, Car, Tech, Luxe, LifeStyle ou Cartoon.
   - **Fichier audio** : glisser-déposer votre MP3 (max ~50 Mo recommandé).
   - **Durée** : format mm:ss (ex: 0:32).
6. Cliquer **Publish → Publish now**.
7. Attendre ~45 secondes : le site se met à jour automatiquement.

### Ajouter un film (vidéo YouTube)

1. Dans le back-office, cliquer **Films → New Film**.
2. Remplir :
   - **Titre** : le titre du film.
   - **Slug** : identifiant unique.
   - **Lien YouTube** : coller l'URL complète (ex: `https://www.youtube.com/watch?v=ABC123`).
   - **Client**, **Année**, **Durée**.
3. La miniature YouTube sera utilisée automatiquement. Vous pouvez en uploader une personnalisée si vous voulez.
4. **Publish**.

### Créer une playlist privée (pour un casting)

1. Dans le back-office, cliquer **Playlists privées → New Playlist**.
2. Remplir :
   - **Titre** : ex. "Casting Renault — Voix père de famille"
   - **Slug** : ex. `casting-renault-mars` (ce sera l'URL : **jbguionie.fr/p/casting-renault-mars**)
   - **Message d'accueil** : court message personnalisé pour le destinataire.
   - **Extraits inclus** : sélectionner les extraits dans la liste, dans l'ordre voulu.
   - **Date d'expiration** (optionnel) : si vous voulez que le lien expire automatiquement.
3. **Publish**.
4. **Copier l'URL** `https://jbguionie.fr/p/votre-slug` et l'envoyer par mail au destinataire.

---

## 🔧 Maintenance

### Modifier un extrait existant
1. Aller sur `/admin`, cliquer sur l'extrait, modifier, **Publish**.

### Supprimer un extrait
1. Sur `/admin`, ouvrir l'extrait, cliquer **Delete entry**.

### Annuler une modification
- Tout est versionné sur GitHub. Si une erreur a été commise, on peut revenir à n'importe quelle version précédente depuis GitHub.

---

## 📁 Structure du projet

```
jbguionie-portfolio/
├── index.html                  # Page d'accueil
├── playlist.html               # Template playlist privée
├── admin/
│   ├── index.html              # Interface Decap CMS
│   └── config.yml              # Configuration du back-office
├── assets/
│   ├── css/style.css           # Styles du site
│   ├── js/
│   │   ├── main.js             # Logique page principale
│   │   └── playlist.js         # Logique page playlist
│   ├── media/                  # Fichiers uploadés via Decap (MP3, images)
│   └── data/                   # JSON générés au build (ne pas éditer)
├── _data/
│   ├── extracts/               # Vos extraits (un fichier .md par extrait)
│   ├── films/                  # Vos films
│   └── playlists/              # Vos playlists privées
├── netlify.toml                # Config déploiement
├── _redirects                  # Règles d'URL
├── build.js                    # Script de conversion .md → JSON
├── package.json                # Dépendances
└── README.md                   # Ce fichier
```

---

## ❓ Aide & problèmes courants

**Le site n'est pas à jour après publication**
→ Attendre 1 minute. Netlify reconstruit le site à chaque modification. Si après 2 minutes ce n'est toujours pas le cas, vérifier dans Netlify → Deploys s'il y a une erreur.

**Je n'arrive pas à me connecter au back-office**
→ Vérifier que **Identity** et **Git Gateway** sont bien activés dans Netlify. Sinon, demander un nouveau lien d'invitation.

**L'audio ne se lit pas**
→ Vérifier que le fichier MP3 a bien été uploadé (taille max recommandée : 10 Mo par fichier). Préférer un encodage MP3 à 192 kbps.

**Une playlist privée affiche "introuvable"**
→ Vérifier que le **slug** dans l'URL correspond exactement au slug de la playlist (sensible à la casse, sans espaces).

---

## 📞 Contact

Jean-Baptiste Guionie — jbguionie@gmail.com
