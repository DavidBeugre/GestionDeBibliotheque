# 📓 Journal de développement

> Ce document retrace, étape par étape, la construction complète du projet — décisions de conception,
> commandes exécutées, résultats de tests et de compilation à chaque étape. Il complète le
> [README principal](../README.md) pour qui veut comprendre **comment** et **pourquoi** chaque brique
> a été construite dans cet ordre, avec quels arbitrages.
>
> Pour une présentation du projet côté utilisateur/jury, voir le [README](../README.md) et les
> [guides](./guides/) ; pour l'architecture technique, voir les [diagrammes UML](./uml/) et le
> [modèle de données](./database/).

---

# 📚 Système de Gestion de Bibliothèque — Étape 1 : Initialisation du projet

## 1. Objectif de cette étape

Mettre en place les **fondations professionnelles** du backend :
- Architecture Clean / séparation en couches (config, controllers, middlewares, routes, services, repositories, validators, utils)
- Configuration TypeScript stricte avec alias de chemins
- Sécurité HTTP de base : Helmet, CORS restreint, rate limiting, compression, cookies signés
- Logger structuré (Winston) fichiers + console
- Gestion centralisée des erreurs (`ApiError` / `errorHandler`)
- Connexion Prisma / PostgreSQL (Neon) prête à l'emploi
- Un modèle de données **minimal** (User, Role, Permission, Session) qui sera étendu à l'Étape 2

## 2. Arborescence créée

```
library-management/
└── backend/
    ├── prisma/
    │   └── schema.prisma        # Modèles Auth de base (sera complété étape 2)
    ├── src/
    │   ├── config/
    │   │   ├── env.ts           # Variables d'environnement typées
    │   │   ├── logger.ts        # Logger Winston
    │   │   └── database.ts      # Client Prisma singleton
    │   ├── controllers/         # (vide, étape 3+)
    │   ├── middlewares/
    │   │   ├── errorHandler.middleware.ts
    │   │   └── rateLimiter.middleware.ts
    │   ├── routes/               # (vide, étape 3+)
    │   ├── services/             # (vide, étape 3+)
    │   ├── repositories/         # (vide, étape 3+)
    │   ├── validators/           # (vide, étape 3+)
    │   ├── utils/
    │   │   ├── ApiError.ts
    │   │   └── ApiResponse.ts
    │   ├── uploads/
    │   ├── app.ts                # Configuration Express + sécurité
    │   └── server.ts             # Point d'entrée
    ├── .env.example
    ├── .eslintrc.json
    ├── .gitignore
    ├── package.json
    └── tsconfig.json
```

## 3. Installation

```bash
cd backend
npm install
cp .env.example .env
# -> renseigner DATABASE_URL / DIRECT_URL (Neon PostgreSQL), secrets JWT, SMTP, Cloudinary

npx prisma generate
npx prisma migrate dev --name init
```

## 4. Lancer le serveur en développement

```bash
npm run dev
```

Vérifier que l'API répond :
```bash
curl http://localhost:5000/health
```

Réponse attendue :
```json
{
  "success": true,
  "message": "API Bibliothèque opérationnelle",
  "environment": "development",
  "timestamp": "..."
}
```

## 5. Bonnes pratiques appliquées

- **Typage strict** (`strict: true`, pas de `any` implicite)
- **Aucun secret en dur** : tout passe par `.env` et `src/config/env.ts`
- **Erreurs typées** via `ApiError` avec factory methods (`badRequest`, `unauthorized`, etc.)
- **Réponses API homogènes** via `ApiResponse` (contrat stable pour le frontend)
- **Logs séparés** (erreurs / combinés / console) pour faciliter le debug et l'audit
- **Sécurité par défaut** : Helmet, CORS restreint au frontend, rate limiting global + un limiteur dédié pour les routes sensibles (à activer à l'étape auth)
- **Arrêt gracieux** du serveur (SIGINT/SIGTERM) pour ne pas couper des requêtes en cours

## 6. Tests de cette étape

À ce stade il n'y a pas encore de logique métier à tester unitairement. Validation effectuée :
- ✅ `npm install` : dépendances installées sans erreur
- ✅ Structure de dossiers conforme à l'architecture Clean demandée
- ⏳ `npx prisma generate` : à exécuter dans ton environnement (nécessite un accès réseau vers `binaries.prisma.sh`, indisponible dans le sandbox de génération)
- ⏳ `npm run dev` + `curl /health` : à valider dans ton environnement local

## 7. Améliorations possibles / prochaine étape

- **Étape 2** : compléter `schema.prisma` avec l'ensemble des modèles métier (Book, BookCopy, Author, Publisher, Category, Borrow, Reservation, Fine, Payment, Notification, ActivityLog, AuditLog, LibrarySettings, Attachment) + migrations + seed de démonstration.
- Ajouter Swagger dès que les premières routes existeront (Étape 3).
- Ajouter Husky + lint-staged pour bloquer les commits non lintés (bonus CI/CD, étape 15).

---

# 📚 Étape 2 : Modèle de données complet (Prisma)

## 1. Objectif

Définir l'intégralité du schéma relationnel de l'application dans `backend/prisma/schema.prisma`, avec les bonnes pratiques :
- Enums pour tous les champs à valeurs fermées (statuts, types) → évite les chaînes magiques
- Clés étrangères + index sur toutes les relations et colonnes de filtrage fréquent (`status`, `roleId`, etc.)
- `Decimal` pour tous les montants financiers (prix, amendes, paiements) — jamais de `Float` pour de l'argent
- Séparation `User` (compte système, auth) / `Member` (profil adhérent métier) : un administrateur ou bibliothécaire n'a pas besoin de matricule, carte, abonnement, etc.
- Table de jointure explicite `BookAuthor` (un livre peut avoir plusieurs auteurs, un auteur plusieurs livres)
- `onDelete: Cascade` uniquement où c'est sémantiquement correct (ex. sessions d'un utilisateur supprimé), jamais sur les données métier sensibles (emprunts, amendes) pour préserver la traçabilité

## 2. Modèles créés (20)

| Domaine | Modèles |
|---|---|
| Auth & utilisateurs | `User`, `Role`, `Permission`, `Session` |
| Adhérents | `Member` |
| Catalogue | `Book`, `BookAuthor`, `Author`, `Publisher`, `Category`, `BookCopy` |
| Circulation | `Borrow`, `Reservation`, `Fine`, `Payment` |
| Système | `Notification`, `ActivityLog`, `AuditLog`, `LibrarySettings`, `Attachment` |

## 3. Décisions de conception importantes

- **`Book` vs `BookCopy`** : `Book` porte les métadonnées bibliographiques (ISBN, titre, auteurs...) ; `BookCopy` représente chaque exemplaire physique (numéro d'inventaire, état, statut). Un emprunt (`Borrow`) porte toujours sur un `BookCopy` précis, jamais directement sur un `Book`.
- **`Member` lié 1-1 à `User`** : permet à un même compte d'avoir un rôle système (lecteur) et un profil adhérent complet, tout en gardant `User` léger pour les rôles ADMIN/LIBRARIAN qui n'ont pas de carte de bibliothèque.
- **`ActivityLog` vs `AuditLog`** : `ActivityLog` alimente le fil d'activité récente du dashboard (lecture rapide) ; `AuditLog` est le journal de sécurité/conformité (connexions échouées, IP, user-agent, métadonnées JSON) — deux besoins différents, deux tables différentes.
- **Recherche plein texte** : Prisma stable ne supporte pas nativement `@@fulltext` sur PostgreSQL. Un index `GIN` sur `to_tsvector(title || summary || description)` sera ajouté via une migration SQL brute à l'Étape 4, avec un `@@index([title])` en attendant.
- **`LibrarySettings`** est un modèle singleton (une seule ligne, id fixe `"default"` créée par le seed).

## 4. Commandes de migration

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init_full_schema
npx prisma db seed
```

`npx prisma studio` permet ensuite d'explorer visuellement les données.

## 5. Jeu de données de démonstration (`prisma/seed.ts`)

Crée automatiquement :
- 10 permissions + 3 rôles (ADMIN, LIBRARIAN, READER) avec permissions associées
- 3 comptes de démonstration (mot de passe `Password123!`) :
  - `admin@library.com`
  - `librarian@library.com`
  - `reader@library.com` (avec profil `Member` associé, matricule `ADH-0001`)
- 5 catégories, 1 éditeur, 1 auteur, 1 livre avec 3 exemplaires physiques
- Les paramètres par défaut de la bibliothèque

## 6. Tests de cette étape

- ✅ `npm install` : OK
- ✅ `npx tsc --noEmit` sur le code applicatif (`src/`) : **0 erreur**
- ⏳ `npx prisma generate` / `migrate dev` / `db seed` : à exécuter dans ton environnement (nécessite un accès réseau vers les binaires Prisma et une vraie base Neon PostgreSQL — indisponibles dans ce sandbox de génération)

## 7. Bonnes pratiques appliquées

- Un seul champ « source de vérité » pour la disponibilité (`Book.availableCopies` recalculé par la logique métier, jamais modifié manuellement depuis le frontend)
- Toutes les tables métier ont `createdAt`/`updatedAt`
- Noms de tables en `snake_case` via `@@map` (convention SQL), noms de modèles en `PascalCase` côté Prisma/TypeScript (convention JS)
- Aucune suppression physique des emprunts/amendes/paiements prévue dans les services (soft-delete / statuts) — la logique sera posée à l'Étape 6

## 8. Prochaine étape

➡️ **Étape 3 : Authentification complète** — hashing bcrypt, JWT access + refresh token, cookies httpOnly, rôles & permissions (guards), verrouillage de compte après tentatives échouées, réinitialisation de mot de passe par email, endpoints `/auth/*`, tests d'intégration.

Dis-moi si je peux enchaîner, ou si tu veux ajuster le schéma avant (champ manquant, renommage, etc.).

---

# 🔐 Étape 3 : Authentification complète

## 1. Ce qui a été implémenté

**Endpoints (`/api/v1/auth`)**

| Méthode | Route | Auth requise | Description |
|---|---|---|---|
| POST | `/register` | non | Création de compte (rôle `READER` par défaut) |
| POST | `/login` | non (rate-limité) | Connexion, renvoie l'access token + pose le cookie refresh |
| POST | `/refresh-token` | cookie refresh | Renouvelle l'access token (rotation du refresh token) |
| POST | `/logout` | cookie refresh | Révoque la session courante |
| POST | `/logout-all` | oui | Révoque **toutes** les sessions de l'utilisateur |
| GET | `/me` | oui | Profil de l'utilisateur connecté |
| POST | `/forgot-password` | non (rate-limité) | Envoie un email avec lien de réinitialisation |
| POST | `/reset-password` | non (rate-limité) | Définit un nouveau mot de passe via le token reçu par email |
| POST | `/change-password` | oui | Change le mot de passe (révoque les autres sessions) |
| GET | `/sessions` | oui | Liste les sessions actives (appareils connectés) |
| DELETE | `/sessions/:sessionId` | oui | Révoque une session précise à distance |

## 2. Architecture de sécurité

- **Access token** : JWT signé (15 min par défaut), envoyé dans le corps de la réponse — le frontend le garde **en mémoire** (jamais en `localStorage`, pour limiter l'exposition en cas de XSS).
- **Refresh token** : chaîne opaque aléatoire (256 bits), **jamais un JWT**. Seule son empreinte SHA-256 est stockée en base (table `Session`) ; le token brut est posé dans un cookie `httpOnly`, `secure` (en prod), `sameSite=strict`, restreint au path `/api/v1/auth`.
- **Rotation des refresh tokens** : chaque `/refresh-token` révoque l'ancien token et en émet un nouveau. Si un token déjà révoqué est présenté à nouveau (signal de vol), **toutes** les sessions de l'utilisateur sont révoquées par précaution.
- **Verrouillage de compte** : après `MAX_LOGIN_ATTEMPTS` échecs (5 par défaut), le compte est verrouillé `LOCK_TIME_MINUTES` (15 min) et un email d'alerte est envoyé.
- **Anti-énumération** : les réponses de connexion et de mot de passe oublié ne révèlent jamais si un email existe en base.
- **RBAC** : `authorize(...roles)` pour un contrôle par rôle, `requirePermission('book:delete')` pour un contrôle granulaire par permission (les permissions viennent de la table `Permission`, embarquées dans le JWT à la connexion).
- **CSRF** : cookie `sameSite=strict` sur le refresh token + toutes les routes protégées exigent un header `Authorization: Bearer` (jamais envoyé automatiquement par le navigateur) → une requête forgée depuis un autre site ne peut ni lire ni fournir l'access token.
- **XSS** : Helmet + CSP actifs ; refresh token en cookie `httpOnly` inaccessible au JS.
- **Rate limiting dédié** sur `/login`, `/forgot-password`, `/reset-password` (10 requêtes / 15 min).
- **Journal d'audit** : `AuditLog` enregistre `LOGIN`, `FAILED_LOGIN`, `LOGOUT`, `PASSWORD_CHANGE`, `PASSWORD_RESET`, `CREATE` (inscription) avec IP et user-agent.

## 3. Fichiers créés

```
src/
├── controllers/auth.controller.ts
├── services/
│   ├── auth.service.ts        # logique métier complète
│   ├── token.service.ts       # JWT access + refresh opaque
│   ├── email.service.ts       # Nodemailer (reset password, bienvenue, alerte verrouillage)
│   └── audit.service.ts
├── repositories/
│   ├── user.repository.ts
│   └── session.repository.ts
├── middlewares/
│   ├── auth.middleware.ts     # authenticate / authorize / requirePermission
│   └── validate.middleware.ts
├── validators/auth.validator.ts
├── routes/{auth.routes.ts, index.ts}
├── types/express.d.ts         # typage de req.user
└── utils/{password.util.ts, crypto.util.ts, asyncHandler.ts}
```

## 4. Tests — **28/28 passent** ✅

```bash
npm test
```

Ce qui est couvert (sans nécessiter de base de données, via des tests unitaires purs + Supertest sur l'app Express) :
- `password.util` : hashing bcrypt, unicité du salage, règles de complexité (table de cas)
- `crypto.util` : génération de token opaque, déterminisme du hash
- `TokenService` : signature/vérification JWT, rejet des tokens invalides ou mal signés, génération de refresh token
- `authenticate` / `authorize` / `requirePermission` : tous les cas passants et bloquants (401/403)
- `app.test.ts` (Supertest) : `/health` → 200, validations `/auth/login` → 400, `/auth/me` sans token → 401, route inconnue → 404

> Les tests d'intégration bout-en-bout avec une vraie base (login réel, refresh, verrouillage de compte) seront ajoutés à l'Étape 15, une fois une base de test dédiée branchée en CI.

## 5. Exemple d'utilisation

```bash
# Inscription
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"jean@example.com","password":"Password123!","firstName":"Jean","lastName":"Dupont"}'

# Connexion
curl -X POST http://localhost:5000/api/v1/auth/login -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@library.com","password":"Password123!"}'

# Route protégée
curl http://localhost:5000/api/v1/auth/me -H "Authorization: Bearer <accessToken>"

# Renouvellement du token
curl -X POST http://localhost:5000/api/v1/auth/refresh-token -b cookies.txt
```

## 6. Bonnes pratiques appliquées

- Séparation stricte **controller → service → repository** (aucune requête Prisma dans un controller)
- Aucune logique métier dupliquée entre `login`/`register`/`refresh` : `issueTokens()` centralise l'émission des tokens
- Erreurs toujours typées (`ApiError`), jamais de `throw new Error()` générique
- Emails et audit ne font jamais échouer le flux principal (try/catch dédiés + logs)
- Mots de passe : jamais loggés, jamais renvoyés dans les réponses API

## 7. Améliorations possibles

- Double authentification (TOTP) — les champs `twoFactorEnabled`/`twoFactorSecret` sont déjà prévus dans le modèle `User` pour cette évolution bonus.
- Détection géographique des connexions inhabituelles (nouvelle ville/pays) avant envoi d'alerte.
- File d'attente (BullMQ) pour les emails plutôt qu'un envoi synchrone.

## 8. Prochaine étape

➡️ **Étape 4 : API REST — Livres, Exemplaires, Auteurs, Éditeurs, Catégories** (CRUD complets, pagination, filtres, recherche plein texte, upload de couverture vers Cloudinary, génération de QR Code/code-barres, Swagger).

Je continue ?

---

# 📖 Étape 4 : API REST — Livres, Exemplaires, Auteurs, Éditeurs, Catégories

## 1. Endpoints livrés

**Catalogue de base** (`/api/v1/categories`, `/api/v1/publishers`, `/api/v1/authors`) — CRUD complet identique pour les trois :
`GET /` (liste paginée + recherche par nom), `GET /:id`, `POST /` (auth + permission `book:create`), `PATCH /:id` (`book:update`), `DELETE /:id` (`book:delete`, bloqué si des livres y sont encore rattachés). Les auteurs ont en plus `POST /authors/:id/photo` (upload Cloudinary).

**Livres** (`/api/v1/books`)

| Méthode | Route | Description |
|---|---|---|
| GET | `/` | Liste paginée avec filtres + recherche |
| GET | `/:id` | Détail complet (auteurs, catégorie, éditeur, exemplaires) |
| POST | `/` | Création (auth + `book:create`) |
| PATCH | `/:id` | Mise à jour (`book:update`) |
| DELETE | `/:id` | Archivage doux (`book:delete`) — refusé si des exemplaires sont empruntés |
| POST | `/:id/cover` | Upload de couverture (multipart, champ `cover`) → Cloudinary |
| GET | `/:id/qrcode` | Génère un QR Code (encodant id + ISBN), l'upload et renvoie son URL |
| GET | `/:id/copies` | Liste des exemplaires physiques |
| POST | `/:id/copies` | Ajoute un exemplaire (numéro d'inventaire auto-généré si omis) |
| PATCH | `/:id/copies/:copyId` | Modifie état/emplacement/statut d'un exemplaire |
| DELETE | `/:id/copies/:copyId` | Supprime un exemplaire (refusé s'il est actuellement emprunté) |

**Filtres disponibles sur `GET /books`** : `search` (titre/sous-titre/ISBN/résumé/cote/nom d'auteur), `categoryId`, `publisherId`, `authorId`, `status`, `language`, `yearFrom`/`yearTo`, `tag`, plus pagination générique `page`/`limit`/`sort`/`order`.

**Documentation interactive** : `GET /api-docs` (Swagger UI, générée depuis les annotations JSDoc des routes).

## 2. Décisions de conception

- **`Book` (métadonnées) vs `BookCopy` (exemplaire)** : `totalCopies`/`availableCopies` sur `Book` ne sont **jamais** modifiés directement — `BookRepository.recalculateCopyCounts()` les recalcule depuis l'état réel de la table `BookCopy` après chaque ajout/modification/suppression d'exemplaire. Une seule source de vérité, zéro désynchronisation possible.
- **Suppression = archivage** : `DELETE /books/:id` ne supprime jamais physiquement un livre (passe son `status` à `ARCHIVED`), et refuse même l'archivage si des emprunts sont en cours. La suppression physique d'un exemplaire est, elle, autorisée mais bloquée s'il est actuellement emprunté.
- **Recherche** : implémentée avec des clauses `contains`/`insensitive` Prisma (portable, aucune migration requise). Un index GIN PostgreSQL (`to_tsvector`) pourra être ajouté en production pour accélérer la recherche sur de gros volumes — non nécessaire pour un projet de soutenance.
- **Upload d'images** : `multer` en stockage mémoire (jamais sur disque) → buffer envoyé directement à Cloudinary via un flux (`upload_stream`), aucun fichier temporaire à nettoyer.
- **QR Code** : généré à la volée (librairie `qrcode`), uploadé sur Cloudinary, l'URL est mise en cache dans `Book.qrCode` pour ne pas le régénérer à chaque appel d'impression d'étiquette.
- **Permissions unifiées** : `book:create`/`book:update`/`book:delete` couvrent l'ensemble du catalogue (livres, auteurs, éditeurs, catégories) — ce sont des ressources de gestion de fond de bibliothèque gérées par les mêmes rôles (Admin/Bibliothécaire). La lecture (`GET`) reste publique pour permettre un futur catalogue consultable sans compte.

## 3. Fichiers créés

```
src/
├── config/{cloudinary.ts, swagger.ts}
├── middlewares/upload.middleware.ts
├── utils/{pagination.util.ts, cloudinary.util.ts, qrcode.util.ts, bookQuery.util.ts}
├── validators/{common.validator.ts, category.validator.ts, publisher.validator.ts, author.validator.ts, book.validator.ts}
├── repositories/{category, publisher, author, book, bookCopy}.repository.ts
├── services/{category, publisher, author, book}.service.ts
├── controllers/{category, publisher, author, book}.controller.ts
└── routes/{category, publisher, author, book}.routes.ts
```

## 4. Tests — **45/45 passent** ✅ (17 nouveaux)

```bash
npm test
```

Nouveaux tests unitaires purs (aucune base de données requise) :
- `pagination.util` : valeurs par défaut, calcul du `skip`, plafond de `limit`, whitelist des champs de tri
- `bookQuery.util` (`buildBookWhereClause`) : chaque filtre testé isolément puis en combinaison — c'est le cœur logique de la recherche/filtrage, entièrement couvert sans avoir besoin de PostgreSQL

## 5. Exemple d'utilisation

```bash
# Créer un livre avec auteur et catégorie existants
curl -X POST http://localhost:5000/api/v1/books \
  -H "Authorization: Bearer <accessToken>" -H "Content-Type: application/json" \
  -d '{"title":"1984","isbn":"9780451524935","categoryId":"<uuid>","authorIds":["<uuid>"],"year":1949}'

# Rechercher + filtrer
curl "http://localhost:5000/api/v1/books?search=1984&status=ACTIVE&sort=year&order=asc&page=1&limit=10"

# Ajouter un exemplaire
curl -X POST http://localhost:5000/api/v1/books/<id>/copies \
  -H "Authorization: Bearer <accessToken>" -H "Content-Type: application/json" -d '{}'

# Uploader une couverture
curl -X POST http://localhost:5000/api/v1/books/<id>/cover \
  -H "Authorization: Bearer <accessToken>" -F "cover=@couverture.jpg"
```

## 6. Bonnes pratiques appliquées

- Toujours `controller → service → repository`, jamais de logique métier dans les controllers
- Filtres de recherche extraits en fonction **pure** (`buildBookWhereClause`) → testable sans mock, sans base de données
- Toutes les routes de mutation protégées par `authenticate` + `requirePermission`, jamais uniquement par le frontend
- Validation systématique via `express-validator` avant d'atteindre la couche service
- Erreurs métier explicites (ex. "impossible de supprimer, N livres rattachés") plutôt que des erreurs SQL brutes remontées au client

## 7. Améliorations possibles

- Index GIN PostgreSQL + `$queryRaw` pour la recherche plein texte à grande échelle
- Vue "cartes" avec vignettes optimisées (Cloudinary `transformation` à la volée, ex. `w_300,h_400,c_fill`)
- Export en masse du catalogue (CSV/Excel) — prévu à l'Étape « Import/Export »
- Endpoint de scan code-barres/ISBN pour pré-remplir un livre depuis une API externe (ex. Open Library) — bonus

## 8. Prochaine étape

➡️ **Étape 5 : API REST — Adhérents** (CRUD, génération de matricule/carte, upload photo, QR Code carte membre, historique d'emprunts, statuts d'abonnement).

Je continue ?

---

# 🪪 Étape 5 : API REST — Adhérents

## 1. Endpoints livrés (`/api/v1/members`)

> ⚠️ **Module entièrement réservé au personnel** (`authenticate` + permission `member:manage`, donc Admin/Bibliothécaire) — contrairement au catalogue, les données d'un adhérent sont des données personnelles sensibles, jamais consultables publiquement.

| Méthode | Route | Description |
|---|---|---|
| GET | `/` | Liste paginée (filtres `status`, `memberType`, recherche `search`) |
| POST | `/` | Crée le compte utilisateur **et** le profil adhérent en une transaction |
| GET | `/:id` | Détail complet |
| PATCH | `/:id` | Mise à jour (profil adhérent + champs utilisateur liés) |
| DELETE | `/:id` | Suppression (refusée si emprunts en cours ou amendes impayées) |
| GET | `/:id/history` | Historique : emprunts, réservations, amendes (20 plus récents chacun) |
| GET | `/:id/qrcode` | Génère le QR Code de la carte adhérent |
| POST | `/:id/photo` | Upload de la photo (Cloudinary) |
| POST | `/:id/suspend` | Suspend l'adhérent |
| POST | `/:id/reactivate` | Réactive l'adhérent |

## 2. Décisions de conception

- **Un `Member` n'existe jamais sans `User`** : `POST /members` crée les deux dans une **transaction Prisma** (`prisma.$transaction`) — soit les deux existent, soit aucun (jamais de compte orphelin).
- **Mot de passe temporaire** : si aucun mot de passe n'est fourni à la création, un mot de passe fort aléatoire est généré (`generateTemporaryPassword`) et envoyé **une seule fois** par email avec le matricule ; l'adhérent doit le changer à la première connexion (flux déjà disponible via `/auth/change-password`, Étape 3).
- **Matricule / numéro de carte auto-générés** : `ADH-00001`, `CARD-00001`, incrémentés séquentiellement.
- **Suppression protégée** : un adhérent avec un emprunt en cours ou une amende impayée ne peut pas être supprimé — évite de perdre la traçabilité financière et matérielle.
- **`Member.userId` en cascade** : supprimer un `User` supprime automatiquement son `Member` (défini dans le schéma dès l'Étape 2) ; le service supprime donc le `User`, jamais le `Member` directement.
- **Répartition des champs** : l'identité/contact (`firstName`, `lastName`, `phone`, `avatarUrl`, `email`) reste sur `User` (partagé avec l'auth) ; tout ce qui est spécifique à la vie de bibliothèque (`matricule`, `memberType`, `subscriptionExpiry`, `cardNumber`...) reste sur `Member`. `MemberService.update()` répartit automatiquement les champs reçus vers la bonne table.

## 3. Fichiers créés

```
src/
├── repositories/member.repository.ts
├── services/member.service.ts
├── controllers/member.controller.ts
├── validators/member.validator.ts
└── routes/member.routes.ts
```
+ ajout de `generateTemporaryPassword()` (`utils/password.util.ts`) et `sendMemberWelcomeEmail()` (`services/email.service.ts`).

## 4. Tests — **49/49 passent** ✅ (4 nouveaux)

```bash
npm test
```
- `generateTemporaryPassword` : conformité aux règles de complexité, unicité entre appels
- Test d'intégration : `/members` sans authentification → **401** (confirme l'isolation des données personnelles)
- Test d'intégration : `/books` sans authentification → **pas de 401** (confirme que le catalogue reste public en lecture, contraste volontaire avec les adhérents)

## 5. Exemple d'utilisation

```bash
# Créer un adhérent (mot de passe auto-généré, envoyé par email)
curl -X POST http://localhost:5000/api/v1/members \
  -H "Authorization: Bearer <accessToken librarian>" -H "Content-Type: application/json" \
  -d '{"email":"fatou@example.com","firstName":"Fatou","lastName":"Diarra","memberType":"STUDENT"}'

# Rechercher un adhérent
curl "http://localhost:5000/api/v1/members?search=Diarra" -H "Authorization: Bearer <accessToken>"

# Historique complet
curl http://localhost:5000/api/v1/members/<id>/history -H "Authorization: Bearer <accessToken>"
```

## 6. Bonnes pratiques appliquées

- Aucune donnée sensible (mot de passe, hash) jamais renvoyée dans les réponses (`select` explicite sur `User` dans `memberInclude`)
- Transaction atomique pour toute opération touchant plusieurs tables liées
- Emails d'identifiants envoyés une seule fois, jamais stockés en clair
- Mêmes garde-fous de suppression que pour les livres (Étape 4) : cohérence de conception entre modules

## 7. Améliorations possibles

- Génération de la carte d'adhérent complète en PDF (mise en page + QR Code + photo) — regroupée avec les autres exports PDF à l'Étape « Rapports »
- Renouvellement automatique de `subscriptionExpiry` avec notification avant échéance
- Import massif d'adhérents (CSV) — Étape « Import/Export »

## 8. Prochaine étape

➡️ **Étape 6 : API REST — Emprunts, Réservations, Amendes, Paiements** (le cœur métier de la bibliothèque : création d'emprunt, retour, renouvellement, calcul automatique des amendes, réservations avec expiration, encaissement des paiements).

Je continue ?

---

# 🔄 Étape 6 : API REST — Emprunts, Réservations, Amendes, Paiements

## 1. Endpoints livrés

> ⚠️ Comme pour les adhérents, l'intégralité de ce module est réservée au personnel (`authenticate` + `borrow:manage` / `fine:manage`).

**Emprunts** (`/api/v1/borrows`)

| Méthode | Route | Description |
|---|---|---|
| GET | `/` | Liste paginée (filtres `memberId`, `bookCopyId`, `status`, `overdue=true`) |
| POST | `/` | Enregistrer un emprunt |
| GET | `/:id` | Détail |
| POST | `/:id/return` | Retour — calcule le retard, génère l'amende si nécessaire, propose l'exemplaire au prochain réservataire |
| POST | `/:id/renew` | Renouvellement (bloqué si réservation en attente, amende impayée, ou limite atteinte) |
| POST | `/:id/lost` | Déclare le livre perdu, génère une amende égale au prix du livre |
| POST | `/mark-overdue` | Traitement par lot : bascule les emprunts échus en `LATE` + envoie des rappels par email |

**Réservations** (`/api/v1/reservations`) : `GET /`, `POST /` (refusée si un exemplaire est déjà disponible), `POST /:id/cancel`, `POST /:id/fulfill` (convertit réellement la réservation en emprunt), `POST /expire-overdue` (traitement par lot).

**Amendes** (`/api/v1/fines`) : `GET /`, `GET /:id`, `POST /:id/waive` (remise avec motif obligatoire).

**Paiements** (`/api/v1/payments`) : `GET /`, `POST /` (encaissement total ou partiel), `GET /:id`.

## 2. Règles métier centrales

- **Limite d'emprunts** : refusée si l'adhérent a déjà atteint `maxBorrowsPerUser` (paramètre configurable) ou s'il a une amende impayée.
- **Amende de retard** calculée automatiquement au retour : `joursDeRetard × finePerDay`, arrondi au jour supérieur (`computeLateDays`/`computeLateFineAmount`, fonctions **pures**, testées unitairement).
- **File d'attente des réservations (FIFO)** : au retour d'un livre, `ReservationService.offerNextReservation()` cherche la plus ancienne réservation `PENDING` pour ce livre. Si elle existe, l'exemplaire passe à `RESERVED` (au lieu de `AVAILABLE`) et l'adhérent est notifié (email + `Notification` en base) avec un délai de retrait. Sinon, l'exemplaire redevient simplement `AVAILABLE`.
- **Renouvellement encadré** : impossible s'il y a une réservation en attente sur le livre (priorité à l'adhérent suivant), si l'adhérent a une amende impayée, ou au-delà de `MAX_RENEWALS` (2) renouvellements.
- **Livre perdu** : clôture l'emprunt, passe l'exemplaire en `LOST`, génère une amende égale au prix d'achat du livre (si connu).
- **Paiement partiel** : `PaymentService.create` cumule les paiements existants d'une amende ; le statut passe à `PARTIALLY_PAID` tant que la somme n'atteint pas le montant total, puis `PAID`. Impossible de payer plus que le solde restant dû.

## 3. Décisions de conception

- **Aucune tâche planifiée (cron) dans le code** — hors du périmètre d'un backend Express classique sans worker dédié. `POST /borrows/mark-overdue` et `POST /reservations/expire-overdue` exposent cette logique comme des **actions déclenchables** (manuellement par un admin, ou par un scheduler externe / la fonctionnalité bonus WebSockets prévue plus tard).
- **`Fine` reste 1-1 avec `Borrow`** (contrainte posée dès le schéma de l'Étape 2) : chaque amende naît d'un emprunt précis (retard ou perte), ce qui garantit une traçabilité complète — pas d'amende "flottante" sans origine.
- **Pas de couplage direct entre services de domaines différents quand un repository suffit** : `BorrowService` interroge `ReservationRepository` directement pour vérifier une file d'attente (pas besoin de tout `ReservationService`), ce qui évite les imports circulaires entre `borrow.service.ts` et `reservation.service.ts`.
- **`createFromReservation`** géré côté `BorrowService` (pas `ReservationService`) : convertir une réservation en emprunt **est** une création d'emprunt avec une règle de sélection d'exemplaire différente — la logique métier reste à un seul endroit plutôt que dupliquée.

## 4. Tests — **60/60 passent** ✅ (11 nouveaux)

```bash
npm test
```
- `circulation.util` (9 tests) : `computeLateDays` (à échéance, retard partiel arrondi, plusieurs jours), `computeLateFineAmount`, `addDays`/`addHours`, `sumPayments` — le cœur du calcul financier entièrement testé sans base de données
- Tests d'intégration : `/borrows` et `/reservations` sans authentification → **401**

## 5. Exemple d'utilisation

```bash
# Emprunter un livre
curl -X POST http://localhost:5000/api/v1/borrows \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"memberId":"<uuid>","bookCopyId":"<uuid>"}'

# Retourner (amende générée automatiquement si en retard)
curl -X POST http://localhost:5000/api/v1/borrows/<id>/return -H "Authorization: Bearer <token>"

# Réserver un livre indisponible
curl -X POST http://localhost:5000/api/v1/reservations \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"memberId":"<uuid>","bookId":"<uuid>"}'

# Encaisser un paiement partiel
curl -X POST http://localhost:5000/api/v1/payments \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"fineId":"<uuid>","amount":50,"method":"CASH"}'
```

## 6. Bonnes pratiques appliquées

- Toute la logique de calcul financier (retards, amendes, sommes payées) isolée en fonctions pures testables
- Aucune donnée financière en `Float` — `Decimal` de bout en bout (schéma) et arrondis explicites côté service
- Chaque transition d'état (`BookCopy.status`, `Borrow.status`, `Reservation.status`) documentée et centralisée dans un seul service responsable
- Audit systématique des actions sensibles (création d'emprunt, retour, perte, remise d'amende, paiement)

## 7. Améliorations possibles

- Tâche planifiée réelle (node-cron / BullMQ) pour `mark-overdue` et `expire-overdue`, au lieu d'un déclenchement manuel
- Notifications temps réel via WebSockets (Socket.IO) quand une réservation devient disponible — bonus prévu
- Génération de reçu PDF à chaque paiement — regroupée avec les autres exports à l'Étape « Rapports »

## 8. Prochaine étape

➡️ **Étape 7 : Notifications, journal d'audit (vue API), paramètres de la bibliothèque** — endpoints pour consulter/marquer comme lues les notifications, exposer le journal d'audit déjà alimenté depuis l'Étape 3, et gérer les paramètres globaux (durée d'emprunt, montant des amendes, jours fériés...).

Je continue ?

---

# 🔔 Étape 7 : Notifications, journal d'audit, paramètres de la bibliothèque

## 1. Endpoints livrés

**Notifications** (`/api/v1/notifications`) — strictement personnelles, aucune permission spéciale requise (chaque utilisateur ne voit que les siennes) :

| Méthode | Route | Description |
|---|---|---|
| GET | `/` | Liste paginée (filtre `isRead`) |
| GET | `/unread-count` | Nombre de notifications non lues (badge navbar) |
| PATCH | `/:id/read` | Marquer comme lue |
| PATCH | `/read-all` | Tout marquer comme lu |
| DELETE | `/:id` | Supprimer |

**Journal d'audit** (`/api/v1/audit-logs`) — **réservé aux administrateurs** (`authorize(ADMIN)`, pas seulement une permission — un bibliothécaire ne doit jamais voir les tentatives de connexion échouées ou les IP de ses collègues) :
`GET /` (filtres `userId`, `action`, `entityType`, `dateFrom`/`dateTo`), `GET /:id`.

**Activité récente** (`/api/v1/activity-logs/recent`) — visible par tout le personnel (Admin + Bibliothécaire), alimente le flux "activités récentes" du futur dashboard.

**Paramètres** (`/api/v1/settings`) : `GET /` **public** (le frontend en a besoin avant même la connexion : nom, logo), `PATCH /` et `POST /logo` réservés à `settings:manage` (Admin).

## 2. Décisions de conception

- **`AuditLog` vs `ActivityLog`, deux publics différents** : le journal d'audit (connexions échouées, IP, user-agent) est une donnée de sécurité — accès **rôle strict ADMIN**, jamais une simple permission (qui pourrait être mal attribuée). Le fil d'activité récente est une donnée de confort d'usage (dashboard) — accès à tout le personnel.
- **Vie privée des notifications par conception** : `NotificationService` vérifie systématiquement que `notification.userId === req.user.id` avant toute lecture/action, et renvoie **404** (pas 403) si ce n'est pas le cas — on ne révèle même pas l'existence de la notification d'un tiers.
- **`ActivityService` branché rétroactivement** sur les événements les plus significatifs pour un dashboard (création/retour d'emprunt, paiement) plutôt que sur toutes les routes CRUD — un fil d'activité qui contient "catégorie modifiée" 50 fois par jour n'a aucune valeur ; les événements de circulation (emprunts, paiements) sont ceux qu'un bibliothécaire veut réellement suivre en temps réel.
- **`LibrarySettings` auto-créé** : `SettingsRepository.getFull()` crée la ligne par défaut si elle n'existe pas encore (au cas où le seed n'a pas été lancé), pour que `PATCH /settings` ne échoue jamais sur un "record not found".
- **Paramètres publics vs privés** : seuls les champs d'identité/branding (nom, logo, coordonnées) sont exposés via `GET /settings` sans authentification — c'est un choix assumé pour permettre au frontend d'afficher le nom et le logo de la bibliothèque sur l'écran de connexion.

## 3. Fichiers créés

```
src/
├── repositories/{notification, auditLog, activityLog}.repository.ts
├── services/{notification, auditLog, activity, settings}.service.ts
├── controllers/{notification, auditLog, settings}.controller.ts
├── validators/{notification, auditLog, settings}.validator.ts
└── routes/{notification, auditLog, activityLog, settings}.routes.ts
```
+ extension de `settings.repository.ts` (lecture complète + mise à jour, en plus des valeurs "effectives" déjà utilisées par la circulation depuis l'Étape 6) et intégration d'`ActivityService` dans `BorrowService`/`PaymentService`.

## 4. Tests — **64/64 passent** ✅ (4 nouveaux)

```bash
npm test
```
- `/notifications` sans authentification → **401**
- `/settings` sans authentification → **pas de 401** (accès public confirmé)
- `/audit-logs` sans authentification → **401** ; avec un token **LIBRARIAN** valide → **403** (confirme que le contrôle est bien par rôle strict, pas juste "être connecté")

## 5. Exemple d'utilisation

```bash
# Notifications non lues
curl http://localhost:5000/api/v1/notifications/unread-count -H "Authorization: Bearer <token>"

# Paramètres publics (page de connexion)
curl http://localhost:5000/api/v1/settings

# Journal d'audit (admin uniquement)
curl "http://localhost:5000/api/v1/audit-logs?action=FAILED_LOGIN" -H "Authorization: Bearer <admin token>"

# Mettre à jour la durée d'emprunt par défaut
curl -X PATCH http://localhost:5000/api/v1/settings \
  -H "Authorization: Bearer <admin token>" -H "Content-Type: application/json" \
  -d '{"borrowDurationDays":21}'
```

## 6. Bonnes pratiques appliquées

- Séparation claire sécurité (`AuditLog`, rôle strict) / confort (`ActivityLog`, permission large)
- Écriture de logs toujours dans un `try/catch` dédié (déjà posé à l'Étape 3 pour l'audit, repris à l'identique pour l'activité) — un échec de journalisation ne casse jamais une opération métier
- Contrôle de propriété systématique sur les ressources personnelles (notifications)

## 7. Améliorations possibles

- WebSockets (Socket.IO) pour pousser les notifications en temps réel plutôt qu'en polling — bonus prévu
- Rétention/purge automatique des vieux logs d'audit (politique de conservation configurable)
- Jours fériés (`LibrarySettings.holidays`) actuellement stockés mais pas encore utilisés dans le calcul des échéances d'emprunt — amélioration possible du calcul de `dueDate` pour exclure les jours de fermeture

## 8. Prochaine étape

➡️ **Étape 8 : Frontend — setup** (Vite + React 19 + TypeScript + Tailwind + shadcn/ui + React Router + TanStack Query + Design System). C'est le vrai point de bascule du projet : le backend a maintenant tous les modules nécessaires (auth, catalogue, adhérents, circulation, notifications, paramètres) pour qu'un frontend complet puisse s'y brancher.

Je continue ?

---

# 🎨 Étape 8 : Frontend — Setup, Design System

## 1. Stack mise en place

Vite 6 · React 19 · TypeScript strict · Tailwind CSS · shadcn/ui (style "new-york") · React Router 7 · TanStack Query · React Hook Form + Zod · Axios · Framer Motion · Lucide Icons · Recharts · React Hot Toast.

## 2. Arborescence

```
frontend/
├── src/
│   ├── components/ui/       # Button, Input, Label, Card, Badge, Skeleton (shadcn, écrits à la main)
│   ├── pages/                # StyleGuidePage (page de référence pour cette étape)
│   ├── layouts/               # (vide, Étape 9)
│   ├── hooks/                 # (vide, Étape 9)
│   ├── services/apiClient.ts # Axios + refresh automatique du token
│   ├── utils/getApiErrorMessage.ts
│   ├── types/index.ts        # Types miroir des modèles backend
│   ├── contexts/ThemeContext.tsx
│   ├── constants/index.ts    # queryKeys, PERMISSIONS, ROLE_LABELS
│   ├── routes/router.tsx
│   ├── lib/{utils.ts, queryClient.ts}
│   ├── App.tsx, main.tsx, index.css, vite-env.d.ts
├── index.html, vite.config.ts, tailwind.config.ts, components.json
└── tsconfig.json / tsconfig.app.json / tsconfig.node.json
```

## 3. Design System — une identité propre pour ce projet

Plutôt qu'un thème shadcn par défaut, un système de tokens dédié à l'univers d'une bibliothèque :

- **Couleurs** : primaire vert "lampe de bibliothèque" (`hsl(158 64% 24%)`), accent laiton utilisé avec parcimonie (badges, éléments actifs), fond papier chaud plutôt que blanc pur ou crème générique.
- **Typographie à trois rôles** : *Source Serif 4* pour les titres (évoque la typographie du livre), *Inter* pour l'interface (lisibilité en haute densité, comme Linear/Vercel), *JetBrains Mono* pour toute donnée tabulaire — cotes, ISBN, matricules, montants (classe utilitaire `.font-data`).
- **Élément signature** : la classe `.card-spine` — un fin liseré de 4px sur le bord gauche d'une carte, clin d'œil aux dos de livres alignés sur une étagère. Réservé aux cartes statistiques du dashboard et à l'item de navigation actif, pour ne pas diluer l'effet.
- **Ombres très subtiles** (à la Stripe), rayons modérés (12px cartes, 8px champs/boutons) — ni la bulle Material trop ronde, ni le rectangle sec à 0px.
- **Mode clair/sombre** complet avec persistance `localStorage` et détection de la préférence système au premier chargement.
- **Accessibilité** : focus clavier toujours visible (`:focus-visible`), `prefers-reduced-motion` respecté globalement.

## 4. Décisions d'architecture

- **Client Axios avec rotation automatique du token** (`services/apiClient.ts`) : l'access token vit uniquement en mémoire JS (jamais `localStorage`), cohérent avec le choix de sécurité posé à l'Étape 3 backend. Sur un 401, une seule requête de refresh est mutualisée entre toutes les requêtes en attente (`refreshPromise`), pour éviter une tempête d'appels `/refresh-token` en cas de rafale de requêtes simultanées.
- **`queryKeys` centralisées** (`constants/index.ts`) : évite les tableaux de clés TanStack Query dupliqués/désynchronisés entre pages au fil des prochaines étapes.
- **Types miroir du backend** (`types/index.ts`) : pas de génération automatique depuis le schéma Prisma à ce stade (ajouterait de la complexité de tooling pour un projet de soutenance) — les types sont tenus à jour manuellement, mappés 1:1 sur les réponses de l'API.
- **`StyleGuidePage` en page temporaire** : sert de preuve de fonctionnement de toute la stack assemblée, et de référence visuelle pour construire les pages suivantes de façon cohérente. Sera retirée du routeur à l'Étape 9 au profit des vraies pages (connexion, dashboard).

## 5. Validation effectuée

```bash
cd frontend
npm install
npm run build   # tsc -b && vite build
npm run lint
```

- ✅ Installation réelle des 480 paquets (packages publics npm, accessibles depuis ce sandbox)
- ✅ `tsc -b` : compilation stricte sans erreur
- ✅ `vite build` : bundle de production généré avec succès (`dist/`)
- ✅ `eslint` : 0 erreur (3 avertissements bénins, pattern standard shadcn/ui sur le Fast Refresh)

## 6. Prochaine étape

➡️ **Étape 9 : Frontend — Authentification + layout applicatif** (page de connexion connectée à l'API, contexte d'authentification complet avec refresh automatique, sidebar/navbar responsive, routes protégées par rôle/permission, redirections, pages 403/404/500).

Je continue ?

---

# 🔑 Étape 9 : Frontend — Authentification, layout, routes protégées

## 1. Ce qui a été construit

**Authentification**
- `services/auth.service.ts` : login, register, logout, me, refresh, forgot/reset/change password
- `contexts/AuthContext.tsx` : restaure la session au chargement de l'app via le cookie httpOnly (`authService.refresh()`), expose `user`, `isAuthenticated`, `hasRole()`, `hasPermission()`
- Pages : `LoginPage`, `ForgotPasswordPage`, `ResetPasswordPage` — formulaires React Hook Form + Zod, mêmes règles de complexité de mot de passe que le backend (Étape 3)

**Layout applicatif**
- `AppLayout` : sidebar fixe desktop (264px) + tiroir mobile (`Sheet`, Radix Dialog stylé), navbar sticky avec recherche globale, notifications (badge), sélecteur de thème, menu utilisateur
- `AuthLayout` : layout centré pour les pages de connexion/mot de passe
- Navigation filtrée par rôle directement dans `SidebarContent` (un `READER` ne voit pas "Adhérents"/"Emprunts")

**Routes protégées**
- `ProtectedRoute` : redirige vers `/login` si non authentifié, mémorise l'URL d'origine (`state.from`) pour y revenir après connexion
- `RoleGuard` : redirige vers `/403` si le rôle ne correspond pas (ex. `/settings` réservé à `ADMIN`)
- Pages d'état : `NotFoundPage` (404), `ForbiddenPage` (403), `ServerErrorPage` (500) + `ErrorBoundary` React (erreurs de rendu) et `RouteErrorBoundary` (erreurs de chargement de route)

## 2. Décisions de conception

- **Restauration de session sans jamais toucher au localStorage** : au chargement, l'app appelle silencieusement `/auth/refresh-token` (le cookie httpOnly suffit) ; si ça échoue, l'utilisateur est simplement traité comme non connecté — aucun état d'authentification n'est jamais persisté côté client en clair.
- **Anti-énumération respectée côté UI** : `ForgotPasswordPage` affiche toujours le même message de confirmation, qu'un compte existe ou non pour l'email saisi — cohérent avec le comportement du backend (Étape 3).
- **Guards composables** : `RoleGuard` est un composant de route à part entière (pas une simple condition dans chaque page), ce qui permet de protéger un groupe entier de routes en une seule déclaration dans `router.tsx`.
- **Pages "à venir" plutôt que routes manquantes** : chaque lien de la sidebar mène déjà à une route réelle (protégée, avec le bon layout) même si le contenu métier arrive dans une étape ultérieure — évite les 404 pendant la construction incrémentale du projet.

## 3. Fichiers créés

```
src/
├── services/auth.service.ts
├── contexts/AuthContext.tsx
├── routes/{ProtectedRoute, RoleGuard}.tsx
├── layouts/{AppLayout, AuthLayout}.tsx
├── components/layout/{Navbar, SidebarContent, navConfig}.tsx
├── components/ui/{dropdown-menu, avatar, sheet}.tsx
├── components/ErrorBoundary.tsx
├── pages/auth/{LoginPage, ForgotPasswordPage, ResetPasswordPage, authSchemas}.tsx
├── pages/errors/{StatePage, NotFoundPage, ForbiddenPage, ServerErrorPage}.tsx
├── pages/{DashboardPage, ComingSoonPage}.tsx
└── routes/router.tsx (arbre complet)
```

## 4. Validation effectuée

```bash
cd frontend
npm install
npm run build   # tsc -b && vite build
npm run lint
```
- ✅ `tsc -b` : 0 erreur
- ✅ `vite build` : bundle généré avec succès (avertissement mineur sur la taille du chunk JS — le code-splitting par route sera ajouté en optimisation finale)
- ✅ `eslint` : 0 erreur (avertissements Fast Refresh bénins, standards sur les fichiers exportant à la fois un composant et un hook)

## 5. Améliorations possibles

- Code-splitting des routes (`React.lazy` + `Suspense`) pour réduire la taille du bundle initial
- Formulaire d'inscription publique (actuellement seul `POST /members` côté backend crée des comptes adhérents, Étape 5) si une auto-inscription lecteur est souhaitée
- Double authentification (TOTP) côté UI, en miroir du champ `twoFactorEnabled` déjà prévu côté backend

## 6. Prochaine étape

➡️ **Étape 10 : Frontend — Dashboard** (widgets KPI connectés aux vraies données, graphiques Recharts, activité récente, calendrier, notifications).

Je continue ?

---

# 📊 Étape 10 : Frontend — Tableau de bord

## 1. Backend — endpoint d'agrégation ajouté

`GET /api/v1/dashboard/stats` (réservé à `ADMIN`/`LIBRARIAN`) — un seul appel réseau renvoie tout ce dont le dashboard a besoin :
- **Livres** : total, disponibles, empruntés, réservés, perdus, endommagés (comptés au niveau exemplaire, la vraie source de vérité posée dès l'Étape 4)
- **Circulation** : retards, emprunts du jour, retours du jour, réservations en attente
- **Finance** : amendes encaissées ce mois-ci
- **Adhérents** : actifs, nouveaux ce mois-ci
- **Catalogue** : nombre d'auteurs/catégories/éditeurs
- **Tendance sur 6 mois** : emprunts et retours par mois, pour le graphique

Décision : plutôt que de multiplier les appels `GET /books?limit=1`, `GET /members?...` etc. depuis le frontend (N allers-retours, N filtres à reconstruire côté client), un unique endpoint d'agrégation côté serveur — cohérent avec la logique déjà en place pour `/activity-logs/recent` (Étape 7).

## 2. Frontend

- `StatCard` : carte KPI réutilisable (squelette de chargement intégré, variante "accent" pour les indicateurs qui demandent attention — retards, réservations en attente)
- `MonthlyBorrowsChart` : graphique en aires (Recharts) emprunts vs retours sur 6 mois, couleurs alignées sur le Design System (vert primaire / laiton accent)
- `RecentActivityFeed` : consomme `/activity-logs/recent` (déjà construit à l'Étape 7), horodatage relatif en français (`date-fns`)
- **Dashboard différencié par rôle** : `ADMIN`/`LIBRARIAN` voient le vrai tableau de bord ; `READER` voit un espace dédié (son historique personnel arrivera à l'Étape 13) — évite un appel 403 inutile vers un endpoint réservé au personnel.

## 3. Décisions de conception

- **Aucun calcul de statistiques côté frontend** : tous les chiffres viennent tels quels de l'API — le frontend ne fait qu'afficher, jamais recalculer (évite les incohérences entre plusieurs endroits de l'app qui "recalculeraient" différemment le même chiffre).
- **6 mois glissants calculés par requêtes simples** plutôt qu'un `GROUP BY date_trunc` en SQL brut : suffisant à l'échelle d'un projet de soutenance, sans complexifier la portabilité du schéma.
- **Gestion d'erreur explicite** : si `/dashboard/stats` échoue, une carte d'erreur dédiée s'affiche (pas un dashboard silencieusement vide) — le mode `isError` de TanStack Query est traité comme un cas de premier ordre, pas une exception.

## 4. Validation effectuée

```bash
cd backend && npm test        # 64/64 toujours au vert après l'ajout du module dashboard
cd frontend && npm run build  # tsc -b && vite build
cd frontend && npm run lint
```
- ✅ Backend : `tsc --noEmit` propre, **64/64 tests** toujours au vert
- ✅ Frontend : `tsc -b` propre, `vite build` réussi, `eslint` 0 erreur

## 5. Améliorations possibles

- Code-splitting par route (`React.lazy`) — le bundle a franchi les 500 kB avec Recharts, à traiter avant la mise en production finale
- Calendrier des échéances et widget de notifications enrichi (repoussés du dashboard vers un futur centre de notifications dédié)
- Cache court (`staleTime`) déjà en place (30s, Étape 8) — un rafraîchissement automatique périodique pourrait être ajouté pour un dashboard "temps réel"

## 6. Prochaine étape

➡️ **Étape 11 : Frontend — Livres** (liste type ERP avec recherche/filtres/vue cartes, fiche livre détaillée, gestion des exemplaires, upload de couverture).

Je continue ?

---

# 📚 Étape 11 : Frontend — Livres

## 1. Ce qui a été construit

**Primitives UI ajoutées** : `Select`, `Dialog`, `Tabs`, `Textarea`, `Table` (Radix, style shadcn) + composants communs `Pagination`, `EmptyState`, `ConfirmDialog`.

**Liste des livres** (`/books`) — interface type ERP :
- Recherche instantanée avec debounce (350ms) — titre, ISBN, auteur, cote
- Filtres catégorie + statut, combinables avec la recherche
- Bascule vue tableau / vue cartes (couvertures), état conservé côté client
- Pagination serveur (réutilise directement les `meta` renvoyées par l'API depuis l'Étape 4)
- Actions rapides par ligne (voir, modifier, archiver) visibles uniquement avec la permission `book:create`/`update`/`delete`

**Fiche livre** (`/books/:id`) :
- Couverture + upload direct (Cloudinary via l'API), génération de QR Code à la volée
- Cartes de métadonnées (exemplaires disponibles, ISBN, cote, langue)
- Onglets Informations / Exemplaires
- Gestion des exemplaires : ajout (numéro d'inventaire auto-généré si vide), changement de statut, suppression — appelle directement les endpoints construits à l'Étape 4

## 2. Décisions de conception

- **Aucune re-implémentation de la logique métier côté frontend** : la disponibilité affichée (`availableCopies/totalCopies`) vient telle quelle de l'API, jamais recalculée localement — cohérent avec le principe posé à l'Étape 10.
- **Formulaire unique pour créer et modifier** (`BookFormDialog`) : mêmes champs, mêmes validations Zod, seule la fonction de soumission change — évite deux formulaires à maintenir en parallèle.
- **Suppression = "Archiver" dans l'UI**, jamais "Supprimer" : le libellé reflète honnêtement ce que fait l'API (archivage doux, Étape 4), pas une suppression destructive.
- **Actions de gestion des exemplaires masquées pour les rôles sans permission** : un `READER` qui accéderait à une fiche livre (lecture publique du catalogue, Étape 4) ne voit ni les boutons d'édition, ni le menu d'actions sur les exemplaires.

## 3. Fichiers créés

```
src/
├── components/ui/{select, dialog, tabs, textarea, table}.tsx
├── components/common/{Pagination, EmptyState, ConfirmDialog}.tsx
├── services/{book, catalog}.service.ts
├── hooks/useDebouncedValue.ts
├── utils/statusConfig.ts
└── pages/books/{BooksListPage, BookDetailPage, BookFormDialog, AddCopyDialog, bookSchema}.tsx
```

## 4. Validation effectuée

```bash
cd frontend && npm run build   # tsc -b && vite build
cd frontend && npm run lint
```
- ✅ `tsc -b` : propre dès la première tentative
- ✅ `vite build` : bundle généré (le code-splitting par route, déjà noté à l'Étape 10, devient de plus en plus pertinent à mesure que les pages s'accumulent)
- ✅ `eslint` : 0 erreur

## 5. Améliorations possibles

- Filtres avancés supplémentaires (langue, plage d'années, tags) — déjà supportés côté API (Étape 4), pas encore exposés dans l'UI
- Import/export CSV du catalogue depuis cette page (prévu à l'étape dédiée Import/Export)
- Gestion dédiée des auteurs/éditeurs/catégories (CRUD complet) — actuellement consultables uniquement comme options de sélection dans le formulaire livre

## 6. Prochaine étape

➡️ **Étape 12 : Frontend — Adhérents** (liste, profils, cartes membres avec QR Code, historique).

Je continue ?

---

# 🪪 Étape 12 : Frontend — Adhérents

## 1. Ce qui a été construit

**Liste des adhérents** (`/members`) : recherche instantanée (nom/email/matricule), filtres statut + type d'adhérent, avatar + coordonnées en un coup d'œil, actions rapides (voir, modifier, suspendre/réactiver) selon la permission `member:manage`.

**Fiche adhérent** (`/members/:id`) :
- `MembershipCard` : carte d'adhérent visuelle au format carte physique (ratio 85.6×54mm), dégradé aux couleurs du Design System, QR Code intégré — pensée pour être imprimée ou affichée sur mobile
- Upload de photo, génération de QR Code (mêmes mécanismes que les livres, Étape 11)
- Onglets **Emprunts / Réservations / Amendes** — consomment directement `GET /members/:id/history` (Étape 5), aucune agrégation recréée côté frontend
- Suspension/réactivation en un clic

## 2. Décisions de conception

- **Email non modifiable en édition** (`disabled` sur le champ) : reflète la contrainte métier réelle — l'email est l'identifiant de connexion, le modifier changerait le compte `User` sous-jacent, ce qui n'est pas ce que fait `PATCH /members/:id` côté backend (Étape 5, qui ne touche que les champs `Member` + prénom/nom/téléphone).
- **Mot de passe jamais demandé à la création** : le formulaire ne propose pas de champ mot de passe — cohérent avec le flux backend qui génère un mot de passe temporaire et l'envoie par email (Étape 5). Le message de succès le rappelle explicitement à l'utilisateur.
- **Carte membre comme composant à part** (`MembershipCard`), réutilisable telle quelle plus tard pour l'impression de lots de cartes (bonus prévu).
- **Historique en 3 onglets plutôt qu'une seule liste fusionnée** : emprunts, réservations et amendes ont des colonnes et des statuts différents — les mélanger aurait nécessité soit un tableau à colonnes variables (confus), soit une perte d'information.

## 3. Fichiers créés

```
src/
├── services/member.service.ts
├── components/members/MembershipCard.tsx
└── pages/members/{MembersListPage, MemberDetailPage, MemberFormDialog, memberSchema}.tsx
```
+ extension de `utils/statusConfig.ts` (statuts adhérent, type d'adhérent, statuts emprunt/amende — réutilisés dès l'Étape 13) et de `types/index.ts` (`Reservation`).

## 4. Validation effectuée

```bash
cd frontend && npm run build   # tsc -b && vite build
cd frontend && npm run lint
```
- ✅ `tsc -b` : 2 erreurs détectées et corrigées immédiatement (import inutilisé, type `Reservation` manquant) puis 0 erreur
- ✅ `vite build` : bundle généré
- ✅ `eslint` : 0 erreur

## 5. Prochaine étape

➡️ **Étape 13 : Frontend — Emprunts, réservations, amendes, paiements** (timeline des emprunts, badges de statut visuels, actions rapides retour/renouvellement/perte, encaissement des paiements). C'est la dernière grande étape fonctionnelle avant les Rapports et les finitions.

Je continue ?

---

# 🔄 Étape 13 : Frontend — Emprunts, réservations, amendes, paiements

## 1. Ce qui a été construit

**`AsyncSearchField`** — composant de recherche réutilisable (nouveau) : recherche adhérent/livre avec debounce, résultats en liste flottante, sélection sous forme de "chip" retirable. Utilisé dans les trois dialogues de création (emprunt, réservation) pour transformer une recherche en texte libre en un `memberId`/`bookId` réel sans exposer d'UUID à l'utilisateur.

**Emprunts** (`/borrows`) : filtres statut + retards uniquement, actions rapides retour/renouvellement/déclaration de perte, création guidée en 3 étapes (adhérent → livre → choix de l'exemplaire disponible parmi ceux réellement `AVAILABLE`).

**Réservations** (`/reservations`) : file d'attente visible avec statuts, conversion en emprunt en un clic (`fulfill`), annulation, avertissement préventif dans le formulaire si le livre a déjà un exemplaire disponible (évite un aller-retour serveur inutile pour un cas que l'API rejettera de toute façon).

**Amendes** (`/fines`, nouveau lien de navigation) : encaissement (total ou partiel, montant pré-rempli mais modifiable), remise avec motif obligatoire.

## 2. Décisions de conception

- **Aucune réimplémentation des règles métier côté frontend** : le frontend ne calcule ni les jours de retard, ni le montant des amendes, ni la disponibilité des exemplaires — tout vient de l'API (Étape 6). Le frontend se contente d'afficher le résultat et de relayer les erreurs métier (ex. "limite d'emprunts atteinte") telles quelles via toast.
- **Sélection d'exemplaire explicite plutôt qu'automatique** : `NewBorrowDialog` affiche tous les exemplaires `AVAILABLE` d'un livre et laisse le bibliothécaire choisir — reflète un usage réel (un exemplaire peut être physiquement préférable à un autre) plutôt qu'une sélection arbitraire côté client.
- **Invalidation croisée des caches TanStack Query** : retourner un emprunt invalide `borrows`, `books` (les compteurs de disponibilité changent) et `fines` (une amende a pu être créée) en une seule fonction `invalidateAll()` — évite d'oublier une invalidation au fil des futures évolutions de cette page.
- **Montant de paiement pré-rempli au montant total de l'amende**, mais modifiable : couvre le cas majoritaire (paiement complet) sans bloquer le cas du paiement partiel déjà géré côté backend (Étape 6).

## 3. Fichiers créés

```
src/
├── components/common/AsyncSearchField.tsx
├── services/{borrow, reservation, fine}.service.ts
├── pages/borrows/{BorrowsListPage, NewBorrowDialog}.tsx
├── pages/reservations/{ReservationsListPage, NewReservationDialog}.tsx
└── pages/fines/{FinesListPage, PaymentDialog, WaiveFineDialog}.tsx
```

## 4. Validation effectuée

```bash
cd frontend && npm run build   # tsc -b && vite build
cd frontend && npm run lint
```
- ✅ `tsc -b` : 1 erreur détectée et corrigée (relation `member` manquante sur le type `Reservation`, alignée sur ce que l'API renvoie réellement) puis 0 erreur
- ✅ `vite build` : bundle généré
- ✅ `eslint` : 0 erreur (4 avertissements bénins habituels)

## 5. Où en est le projet

Les 4 rôles métier de la bibliothèque sont maintenant pilotables de bout en bout depuis l'interface : catalogue, adhérents, circulation complète (emprunt → retour/renouvellement/perte → amende → paiement), réservations avec file d'attente. Il reste les Rapports, la documentation finale et les tests/CI/CD pour compléter le cahier des charges.

## 6. Prochaine étape

➡️ **Étape 14 : Rapports & exports** (dashboard analytique, livres populaires, statistiques de retard, exports PDF/Excel/CSV) + **Paramètres** de la bibliothèque côté frontend.

Je continue ?

---

# 📈 Étape 14 : Rapports & exports, Paramètres

## 1. Backend — module de rapports unifié

Plutôt que 7 endpoints JSON + 7×3 endpoints d'export dupliqués, **un seul mécanisme générique** :

- `GET /api/v1/reports/:type` → `{ title, columns, rows, summary? }`
- `GET /api/v1/reports/:type/export?format=csv|excel|pdf` → fichier téléchargeable

`type` ∈ `popular-books`, `never-borrowed`, `overdue`, `fines`, `active-members`, `daily-activity`, `annual-stats`. Chaque rapport a sa propre requête Prisma dans `ReportService`, mais **renvoie tous la même forme** (`columns`/`rows`), ce qui permet à `toCsv`/`toExcelBuffer`/`toPdfBuffer` (nouveaux, `utils/export.util.ts`) de servir n'importe quel rapport sans code dupliqué.

- **CSV** : génération manuelle avec échappement RFC 4180 + BOM UTF-8 (accents corrects à l'ouverture dans Excel)
- **Excel** : `exceljs`, en-tête en gras avec fond vert clair (cohérent avec le Design System)
- **PDF** : `pdfkit`, tableau dessiné manuellement (pdfkit n'a pas de support de tableau natif) avec gestion de saut de page et répétition de l'en-tête

## 2. Frontend

**`ReportsPage`** : sélecteur de type de rapport, filtres contextuels qui n'apparaissent que pour les rapports concernés (plage de dates pour les amendes, date pour l'activité quotidienne, année pour les statistiques annuelles), tableau générique piloté par les `columns`/`rows` reçues de l'API (aucun tableau spécifique par type de rapport à maintenir côté frontend), cartes de synthèse quand l'API renvoie un `summary`, boutons d'export déclenchant un vrai téléchargement de fichier (`responseType: 'blob'`).

**`SettingsPage`** : édition des paramètres globaux (nom, coordonnées, devise, durée d'emprunt, limite d'emprunts, montant d'amende journalier) + upload de logo, réservée aux administrateurs (`RoleGuard`).

## 3. Décisions de conception

- **Un seul mécanisme générique plutôt que 7 modules dupliqués** : chaque nouveau rapport futur ne nécessite qu'une méthode dans `ReportService` renvoyant `{title, columns, rows}` — l'export CSV/Excel/PDF et le rendu frontend fonctionnent automatiquement, sans code supplémentaire.
- **`toPdfBuffer` gère la pagination manuellement** : `pdfkit` ne propose pas de composant tableau ; plutôt qu'une dépendance supplémentaire, une implémentation minimale (positionnement par colonnes, détection de fin de page, répétition de l'en-tête) suffit pour des rapports tabulaires simples.
- **Le frontend ne connaît la forme d'aucun rapport à l'avance** : `ReportsPage` rend n'importe quelles `columns`/`rows` reçues — ajouter un 8ᵉ rapport côté backend n'exige aucune modification du composant de tableau.

## 4. Validation effectuée

```bash
cd backend && npm test         # 68/68 (4 nouveaux tests sur toCsv)
cd backend && npx tsc --noEmit
cd frontend && npm run build
cd frontend && npm run lint
```
- ✅ Backend : **68/68 tests**, compilation propre (plusieurs `implicit any` corrigés en cours de route sur les callbacks d'agrégation)
- ✅ Frontend : `tsc -b` propre, `vite build` réussi, `eslint` 0 erreur

## 5. Où en est le projet

Le cahier des charges fonctionnel est maintenant couvert de bout en bout : authentification complète, catalogue, adhérents, circulation (emprunts/réservations/amendes/paiements), notifications, audit, paramètres, dashboard, et rapports/exports. Il reste, selon la feuille de route initiale : tests frontend, CI/CD, documentation finale (diagrammes UML, guides), et les fonctionnalités bonus (scanner code-barres, WebSockets, PWA...).

## 6. Prochaine étape

➡️ **Étape 15 : Tests (unitaires, intégration, API) + CI/CD** (GitHub Actions : lint, tests, build automatique).

Je continue ?

---

# ✅ Étape 15 : Tests, CI/CD

## 1. Tests frontend (nouveaux) — Vitest + Testing Library

Le frontend n'avait jusqu'ici aucun test automatisé (`vitest` était installé dès l'Étape 8 mais jamais utilisé). **23 tests** couvrent maintenant :

| Fichier | Ce qui est testé |
|---|---|
| `lib/utils.test.ts` | `cn()` — fusion de classes, résolution de conflits Tailwind, valeurs falsy |
| `utils/getApiErrorMessage.test.ts` | Extraction de message d'erreur (Axios, Error générique, valeur de repli) |
| `hooks/useDebouncedValue.test.ts` | Debounce avec timers simulés (`vi.useFakeTimers`) — non-mise à jour avant délai, réinitialisation du minuteur à chaque frappe |
| `components/ui/button.test.tsx` | Rendu, clic, état désactivé pendant le chargement |
| `components/ui/badge.test.tsx` | Rendu, classes de variante |
| `components/dashboard/StatCard.test.tsx` | Affichage valeur vs squelette de chargement, affichage de la tendance |

```bash
cd frontend && npx vitest run
```

**Incident rencontré et corrigé** : les 3 premiers tests de `Button` échouaient par pollution du DOM entre tests (React Testing Library ne nettoyait pas automatiquement, faute de `globals: true` dans la config Vitest). Corrigé en appelant explicitement `cleanup()` dans un hook `afterEach` du fichier de setup — plus robuste qu'activer les globals, et sans ambiguïté avec d'éventuels globals Jest si jamais les deux coexistent dans le monorepo.

## 2. Tests backend (rappel — déjà réalisés au fil des étapes précédentes)

**68 tests** (Jest + Supertest), construits progressivement depuis l'Étape 3 : fonctions métier pures (mots de passe, tokens, retards/amendes, pagination, filtres de recherche, export CSV), middlewares d'authentification/autorisation, et tests d'intégration sur l'application Express (codes de statut, RBAC par rôle, isolation des données personnelles). Le détail complet est documenté à chaque étape correspondante plus haut dans ce README.

## 3. CI/CD — GitHub Actions

Deux workflows indépendants, déclenchés uniquement quand le sous-projet concerné change (`paths` filtrés) :

**`.github/workflows/backend-ci.yml`**
- Service PostgreSQL éphémère (conteneur `postgres:16`) pour une exécution des tests dans des conditions proches de la production
- `npm run lint` → `tsc --noEmit` → `prisma generate` → `prisma migrate deploy` → `npm test -- --ci --coverage` → `npm run build`
- Upload du rapport de couverture en artefact

**`.github/workflows/frontend-ci.yml`**
- `npm run lint` → `tsc -b` → `vitest run` → `npm run build`
- Upload du build (`dist/`) en artefact, prêt à être déployé (Vercel) depuis ce même artefact si souhaité

## 4. Décisions de conception

- **Un vrai PostgreSQL en CI plutôt qu'un mock** : contrairement au sandbox de génération de ce projet (qui n'a pas d'accès réseau vers les binaires Prisma), GitHub Actions a un accès réseau complet — la CI exécute donc les tests dans des conditions réelles, sans les limitations rencontrées pendant le développement assisté.
- **Déclenchement conditionnel par `paths`** : modifier uniquement le frontend ne relance pas inutilement la CI backend (et vice versa) — un choix pertinent dès qu'un monorepo grossit.
- **Artefacts uploadés systématiquement** (`if: always()` pour la couverture) : permet d'inspecter les résultats même en cas d'échec d'une étape ultérieure du job.

## 5. Validation effectuée

```bash
cd frontend && npx vitest run   # 23/23 ✅
cd frontend && npx tsc -b       # propre
cd frontend && npm run lint     # 0 erreur
cd frontend && npm run build    # bundle généré
cd backend && npm test          # 68/68 ✅ (vérifié à l'Étape 14)
```

## 6. Prochaine étape

➡️ **Étape 16 : Documentation finale** (README professionnel consolidé, diagrammes UML — cas d'utilisation, classes, séquence, activité, composants, déploiement —, MER/MLD/MPD, guide d'installation, guide utilisateur, guide administrateur). C'est la dernière étape du plan initial avant les fonctionnalités bonus.

Je continue ?
