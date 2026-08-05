# Guide d'installation

## Prérequis

- Node.js ≥ 20
- npm ≥ 10
- Un compte [Neon](https://neon.tech) (PostgreSQL managé) — ou toute base PostgreSQL 15+
- Un compte [Cloudinary](https://cloudinary.com) (stockage des images)
- Un compte SMTP pour l'envoi d'emails (Gmail, SendGrid, Mailtrap en développement...)

## 1. Cloner le projet

```bash
git clone <url-du-dépôt>
cd library-management
```

## 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Ouvrir `.env` et renseigner au minimum :

```env
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
DIRECT_URL="postgresql://user:password@host/db?sslmode=require"
JWT_ACCESS_SECRET="générer une chaîne aléatoire longue"
JWT_REFRESH_SECRET="générer une autre chaîne aléatoire longue"
COOKIE_SECRET="et une troisième"
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
SMTP_HOST="..."
SMTP_USER="..."
SMTP_PASSWORD="..."
```

> 💡 Pour générer des secrets aléatoires sûrs : `openssl rand -base64 48`

Puis initialiser la base de données :

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

Le seed crée automatiquement (voir `prisma/seed.ts`) :
- 3 comptes de démonstration — `admin@library.com`, `librarian@library.com`, `reader@library.com`
  (mot de passe : `Password123!`)
- Rôles, permissions, catégories, un éditeur, un auteur, un livre avec 3 exemplaires
- Les paramètres par défaut de la bibliothèque

Démarrer le serveur :

```bash
npm run dev
```

Vérifier que l'API répond : [http://localhost:5000/health](http://localhost:5000/health)
Documentation interactive : [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

## 3. Frontend

Dans un second terminal :

```bash
cd frontend
npm install
cp .env.example .env   # optionnel en développement (proxy Vite déjà configuré)
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173) et se connecter avec l'un des comptes de démonstration.

## 4. Lancer les tests

```bash
# Backend (68 tests)
cd backend && npm test

# Frontend (23 tests)
cd frontend && npx vitest run
```

## 5. Build de production

```bash
cd backend && npm run build && npm start
cd frontend && npm run build   # génère frontend/dist/, servi par n'importe quel hébergeur statique
```

## 6. Déploiement (résumé — voir [diagramme de déploiement](../uml/deployment-diagram.md))

| Composant | Plateforme suggérée | Commande de build |
|---|---|---|
| Frontend | Vercel | `npm run build` (dossier `frontend`, sortie `dist`) |
| Backend | Render | `npm run build` puis `npm start` (dossier `backend`) |
| Base de données | Neon | Migrations via `npx prisma migrate deploy` au déploiement |

Variables d'environnement à configurer sur chaque plateforme : mêmes clés que `.env`
(backend) et `VITE_API_URL` (frontend, pointant vers l'URL publique de l'API Render).

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| `Error: P1001` au démarrage | Base de données injoignable | Vérifier `DATABASE_URL`, whitelist IP côté Neon si activée |
| Emails non reçus en développement | SMTP non configuré | Sans SMTP renseigné, les emails sont simplement loggés en console (voir `EmailService`) — normal en dev |
| 401 en boucle sur le frontend | Cookies bloqués | Vérifier que le navigateur autorise les cookies tiers en local (`localhost` ↔ `localhost:5000`) |
| Images non affichées | Cloudinary non configuré | Renseigner les 3 variables `CLOUDINARY_*` |
