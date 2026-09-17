# Tunisia Guess Game

Jeu de quiz sur la culture tunisienne, jouable en équipes autour d'un même écran.
Application web React + TypeScript, bilingue français / arabe, avec un back-office
d'administration et une persistance Firebase.

---

## 1. Principe du jeu

Chaque tour présente une question et six suggestions : **quatre bonnes réponses**
valant 40, 30, 20 et 10 points, et **deux leurres**.

| Action | Conséquence |
|---|---|
| Bonne réponse | Les points de la réponse sont crédités à l'équipe |
| Mauvaise réponse | Une faute est comptée |
| 3 fautes | Le tour s'arrête immédiatement |
| Toutes les bonnes réponses trouvées | Le tour s'arrête, score maximum (100 points) |
| Chrono écoulé (60 s) | Le tour s'arrête, l'équipe garde les points acquis |

Une partie compte `manches × équipes` tours, avec **une question différente par
tour** : aucune équipe ne rejoue une question déjà entendue par les autres.

### Deux modes de jeu

| Mode | Fonctionnement |
|---|---|
| **Local** | Plusieurs équipes autour d'un même écran, chacune son tour. Fonctionne hors ligne. |
| **En ligne** | Chaque joueur sur son appareil, salon partagé par code, **synchronisation temps réel**. Nécessite une connexion. |

---

## 1 bis. Multijoueur en temps réel

L'hôte crée un salon et obtient un **code à 5 caractères** (`LQ6CM`). Les autres
joueurs le saisissent depuis leur propre appareil et apparaissent aussitôt dans
la liste. L'hôte lance la partie : tout le monde reçoit la **même question au
même moment**, avec un **chrono commun de 45 secondes**, et répond de son côté.
Les scores montent en direct sur l'écran de chacun.

**Comment le temps réel est obtenu.** Tout l'état d'une partie tient dans un
**unique document** `Rooms/{code}` ; chaque client y est abonné via
`onSnapshot`. Firestore pousse la moindre modification à tous les participants —
il n'y a donc aucun serveur de jeu à écrire, et aucun sondage périodique.

Deux précautions de concurrence :

- chaque joueur n'écrit **que dans son entrée** (`players.<uid>`), grâce à la
  notation pointée de Firestore : personne ne peut écraser les données d'un autre ;
- les scores sont incrémentés avec `increment()`, évalué côté serveur, donc deux
  joueurs qui répondent en même temps ne s'annulent pas mutuellement ;
- les points sont crédités **à chaque bonne réponse**, et non en fin de tour :
  un joueur qui n'a ni fait trois fautes ni tout trouvé garde ainsi ses points
  quand l'hôte passe à la question suivante.

Le chrono n'est pas diffusé : le document porte une échéance (`turnEndsAt`) et
chaque client en déduit son décompte. Rien à synchroniser, rien à désynchroniser.

---

## 2. Démarrage rapide

**Prérequis : Node.js 22.6 ou plus récent** (`node --version` pour vérifier).

```bash
git clone https://github.com/chalbiarejeb07-ai/tunithQuizGameweb.git
cd tunithQuizGameweb
npm install
npm run dev
```

L'application démarre sur <http://localhost:5173> et **est immédiatement jouable**,
sans configuration, sans compte et sans réseau : elle utilise sa banque de
40 questions embarquée. Le jeu local, les deux langues, les scores et
l'historique fonctionnent tels quels.

Un bandeau orange « Mode hors ligne » signale simplement que Firebase n'est pas
configuré sur ce poste.

### Ce qui nécessite Firebase en plus

| Fonctionne sans configuration | Nécessite `.env.local` |
|---|---|
| Jeu local en équipes | Connexion / inscription |
| 40 questions, FR + AR | Multijoueur en ligne |
| Scores, historique, profil | Tableau de bord administrateur |
| Raccourcis clavier, navigation | Questions servies depuis Firestore |

**`.env.local` n'est pas dans le dépôt** (il est ignoré par Git, et c'est
volontaire). Pour activer ces fonctions sur un autre poste, deux possibilités :

1. **Récupérer la configuration du projet existant.** Les six valeurs `VITE_*`
   ne sont pas secrètes — elles sont incluses dans le code envoyé au navigateur,
   et ce sont les règles Firestore qui protègent les données. Le propriétaire du
   projet peut donc les transmettre directement, à copier dans un fichier
   `.env.local` créé à la racine à partir de `.env.example`.
2. **Créer son propre projet Firebase**, en suivant la section 3 ci-dessous.

Dans les deux cas, vérifiez avec `npm run check-env` (six ✅ attendus), puis
redémarrez `npm run dev` — Vite ne recharge pas les variables d'environnement
à chaud.

> ⚠️ La **clé de compte de service** (`*-firebase-adminsdk-*.json`), elle, est
> réellement secrète : elle donne un accès total au projet et ignore les règles.
> Elle ne doit jamais être commitée ni transmise. Elle ne sert qu'aux scripts
> `seed-quiz` et `create-admin`, sur le poste du propriétaire du projet.

---

## 3. Configuration Firebase

1. Créer un projet sur la [console Firebase](https://console.firebase.google.com).
2. Activer les fournisseurs d'authentification **Google** et **E-mail/Mot de passe**.
3. Créer une base **Firestore**.
4. Enregistrer une application Web et copier sa configuration
   (*Paramètres du projet → Vos applications → Configuration Web*).
5. Créer `.env.local` à la racine à partir de `.env.example` et y coller les valeurs réelles :

   ```powershell
   Copy-Item .env.example .env.local   # Windows PowerShell
   ```
   ```bash
   cp .env.example .env.local          # macOS / Linux
   ```

6. Vérifier que les six variables sont bien renseignées :

   ```bash
   npm run check-env
   ```

7. Redémarrer `npm run dev`.

> **Vite ne recharge pas les variables d'environnement à chaud** : tout changement
> dans `.env.local` impose un redémarrage du serveur de développement.

### Publier les règles de sécurité

Le fichier [`firestore.rules`](firestore.rules) doit être déployé dans la console
Firebase (*Firestore → Règles*) ou via `firebase deploy --only firestore:rules`.

---

## 4. Peupler la base et créer un administrateur

Ces deux commandes utilisent le **Firebase Admin SDK** et nécessitent une clé de
compte de service. Ne jamais committer ce fichier, ni le placer dans une variable
`VITE_*` (tout ce qui est préfixé `VITE_` finit dans le bundle du navigateur).

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\chemin\service-account.json"
```

**Importer les 40 questions dans Firestore :**

```bash
npm run seed-quiz                 # ajoute ou met à jour
npm run seed-quiz -- --reset      # vide la collection Quiz d'abord
```

L'identifiant du document reprend celui de la question : relancer le script met à
jour les questions existantes au lieu de les dupliquer.

**Créer le premier administrateur :**

```bash
npm run create-admin -- admin@example.com "mot-de-passe-solide" "Nom Admin"
```

Le rôle `admin` ne peut pas être attribué depuis le navigateur — les règles
Firestore l'interdisent explicitement. Une fois le premier administrateur créé,
il peut promouvoir les autres depuis le tableau de bord.

---

## 5. Scripts disponibles

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement Vite |
| `npm run build` | Vérification des types puis build de production |
| `npm run preview` | Sert le build de production localement |
| `npm run lint` | Analyse statique (Oxlint) |
| `npm run verify` | **Contrôle d'intégrité du contenu** (questions, traductions, pioche) |
| `npm run check-env` | Vérifie les six variables Firebase |
| `npm run seed-quiz` | Importe la banque de questions dans Firestore |
| `npm run create-admin` | Crée ou met à jour un compte administrateur |

`npm run verify` est à lancer **avant toute démonstration** : il détecte une
question mal formée, un leurre qui rapporterait des points ou une clé de
traduction manquante avant que cela n'apparaisse à l'écran.

---

## 6. Architecture

```
src/
├── data/
│   └── questionBank.ts      Banque de 40 questions bilingues, 8 thèmes
├── game/
│   ├── deck.ts              Logique de pioche — fonctions pures, testables
│   ├── useGameEngine.ts     Moteur du jeu local (tours, fautes, score, chrono)
│   └── useRoom.ts           Pilotage d'un salon multijoueur temps réel
├── screens/                 Un composant par écran
│   ├── MenuScreen.tsx       SetupScreen.tsx     GameScreen.tsx
│   ├── ResultsScreen.tsx    SettingsScreen.tsx  ProfileScreen.tsx
│   ├── OnlineScreen.tsx     Mode en ligne : entrée, salon, match, classement
│   └── AuthScreen.tsx
├── components/              Éléments réutilisables (boutons, badges, graphiques…)
│   ├── AdminDashboard.tsx   Back-office : utilisateurs, questions, statistiques
│   ├── QuestionEditor.tsx   Éditeur bilingue de questions
│   └── Charts.tsx           Graphiques en SVG/CSS, sans librairie externe
├── services/                Accès aux données et effets de bord
│   ├── firebase.ts          Initialisation, détection de configuration absente
│   ├── authService.ts       Authentification et profils
│   ├── quizService.ts       Chargement des questions + CRUD administrateur
│   ├── roomService.ts       Salons temps réel (création, jointure, abonnement)
│   ├── gameHistoryService.ts Historique des parties et statistiques
│   ├── adminService.ts      Agrégation des données du tableau de bord
│   ├── soundService.ts      Audio synthétisé (Web Audio API)
│   └── i18n.ts              Traduction français / arabe
├── context/AuthContext.tsx  Session partagée par toute l'application
└── design/tokens.css        Jetons de design (couleurs, rayons, typographies)
```

**Séparation des responsabilités :** `useGameEngine` ne connaît ni Firebase ni le
DOM — il reçoit une liste de questions et expose l'état d'une partie. Les écrans
ne font que de l'affichage. Les services concentrent les effets de bord.

---

## 7. Stratégie hors ligne

L'application **ne se bloque jamais** sur une erreur de configuration ou de
réseau. Le chargement des questions suit une cascade de replis :

```
Firestore  →  cache localStorage  →  banque embarquée (40 questions)
```

- Sans `.env.local`, l'application démarre et se joue normalement ; un bandeau
  signale le mode hors ligne, l'authentification est désactivée.
- Les parties terminées sont **toujours** écrites dans `localStorage`, et en plus
  dans Firestore si l'utilisateur est connecté. Le mode invité a donc de vraies
  statistiques.
- Un échec d'écriture Firestore est journalisé mais n'interrompt jamais une partie.

C'est un choix délibéré : une démonstration ne doit pas dépendre du réseau.

---

## 8. Modèle de données Firestore

### `Users/{uid}`
```jsonc
{
  "displayName": "Ahmed Ben Ali",
  "email": "ahmed@example.com",
  "username": "ahmed-ben-ali",
  "status": "Active",           // Active | Inactive | Banned
  "role": "user",               // user | player | admin
  "language": "fr",
  "soundPreferences": { "enabled": true, "volume": 0.7, "soundId": "fanfare", "effects": true }
}
```

### `Quiz/{questionId}` — un document par question
```jsonc
{
  "themeId": "cuisine",
  "prompt": { "fr": "…", "ar": "…" },
  "answers": [
    { "label": { "fr": "Poivrons grillés", "ar": "الفلفل المشوي" }, "points": 40, "correct": true },
    { "label": { "fr": "Du riz",           "ar": "الأرز" },          "points": 0,  "correct": false }
  ],
  "status": "Active"            // Active | Inactive
}
```

### `Games/{gameId}`
```jsonc
{
  "uid": "…", "hostName": "Ahmed",
  "teamNames": ["Les Aigles", "Carthage"],
  "scores": [320, 280], "rounds": 5,
  "themes": ["cuisine", "histoire"],
  "winnerIndex": 0, "topScore": 320, "totalPoints": 600,
  "playedAt": 1737072000000
}
```

### `Rooms/{code}` — un document par salon, l'état complet d'une partie
```jsonc
{
  "code": "LQ6CM",
  "hostUid": "…", "hostName": "Chalbia",
  "status": "playing",          // lobby | playing | finished
  "deck": [ /* les questions, identiques pour tous */ ],
  "currentTurn": 2,
  "turnEndsAt": 1737072045000,  // échéance du chrono, déduite par chaque client
  "players":     { "<uid>": { "uid": "…", "name": "Chalbia", "score": 130, "joinedAt": 1737072000000 } },
  "turnAnswers": { "<uid>": { "picks": [0, 3], "gained": 70, "done": false } }
}
```

---

## 9. Sécurité

Les règles [`firestore.rules`](firestore.rules) appliquent :

- **`Users`** — chacun lit et modifie son propre profil, sans jamais toucher à son
  rôle. Un administrateur lit et modifie tous les profils, mais ne peut que
  *promouvoir* : la rétrogradation d'un rôle existant est refusée. La création
  d'un compte avec le rôle `admin` est impossible depuis le client.
- **`Quiz`** — lecture publique (le mode invité doit pouvoir jouer), écriture
  réservée aux administrateurs.
- **`Games`** — une partie ne peut être enregistrée qu'au nom de son propre
  auteur (`request.resource.data.uid == request.auth.uid`).
- **`Rooms`** — lecture et modification réservées aux utilisateurs connectés ; la
  création n'est possible que si l'auteur se déclare lui-même comme hôte, et seul
  l'hôte peut supprimer le salon.

Le premier administrateur est créé hors navigateur, via le Admin SDK.

---

## 10. Stack technique

| Domaine | Choix |
|---|---|
| Interface | React 19, TypeScript, Vite 8 |
| Back-end | Firebase Authentication + Cloud Firestore |
| Styles | CSS natif, jetons de design, sans framework |
| Graphiques | SVG/CSS écrits à la main, sans librairie |
| Audio | Web Audio API — sons synthétisés, aucun fichier à charger |
| Qualité | Oxlint, `tsc --noEmit`, script d'intégrité `npm run verify` |
| i18n | Dictionnaires typés — une clé manquante en arabe est une erreur de compilation |
