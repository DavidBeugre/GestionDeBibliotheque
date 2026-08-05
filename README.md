# 📚 Système de Gestion de Bibliothèque

Application web complète de gestion de bibliothèque — catalogue, adhérents, circulation
(emprunts, réservations, amendes, paiements), notifications, rapports et tableau de bord —
conçue avec une architecture professionnelle (Clean Architecture, SOLID, REST) et une interface
inspirée des meilleurs dashboards SaaS (Notion, Linear, Stripe, Vercel).

![Statut Backend CI](https://img.shields.io/badge/backend-68%2F68%20tests-brightgreen)
![Statut Frontend CI](https://img.shields.io/badge/frontend-23%2F23%20tests-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)
![Licence](https://img.shields.io/badge/licence-MIT-blue)

---

## ✨ Fonctionnalités

- **Authentification complète** — JWT access + refresh token en rotation, verrouillage de compte,
  réinitialisation de mot de passe, sessions actives, rôles et permissions granulaires
- **Catalogue** — livres, exemplaires, auteurs, éditeurs, catégories ; recherche, filtres,
  couvertures et QR Codes
- **Adhérents** — création avec identifiants auto-générés, carte membre visuelle avec QR Code,
  historique complet
- **Circulation** — emprunts, retours, renouvellements, déclarations de perte, réservations avec
  file d'attente FIFO automatique, calcul automatique des amendes de retard, encaissement des
  paiements (total ou partiel)
- **Notifications & audit** — notifications personnelles, fil d'activité récente, journal d'audit
  de sécurité (réservé aux administrateurs)
- **Tableau de bord** — indicateurs clés en temps réel, graphique de tendance sur 6 mois
- **Rapports & exports** — 7 rapports (livres populaires, retards, amendes, adhérents actifs...),
  export CSV / Excel / PDF
- **Paramètres** — configuration de la durée d'emprunt, du nombre maximal d'emprunts, du montant
  des amendes, logo et coordonnées de la bibliothèque

## 🛠️ Stack technique

| Frontend | Backend | Infrastructure |
|---|---|---|
| React 19, TypeScript | Node.js, Express, TypeScript | PostgreSQL (Neon) |
| Vite, Tailwind CSS, shadcn/ui | Prisma ORM | Cloudinary (images) |
| React Router, TanStack Query | JWT, bcrypt, Helmet | SMTP (Nodemailer) |
| React Hook Form, Zod | express-validator | Vercel (frontend) / Render (backend) |
| Recharts, Framer Motion | Jest, Supertest | GitHub Actions (CI/CD) |

## 🚀 Démarrage rapide

```bash
# Backend
cd backend && npm install && cp .env.example .env
npx prisma generate && npx prisma migrate dev && npx prisma db seed
npm run dev

# Frontend (autre terminal)
cd frontend && npm install && npm run dev
```

Comptes de démonstration (créés par le seed, mot de passe `Password123!`) :

| Rôle | Email |
|---|---|
| Administrateur | `admin@library.com` |
| Bibliothécaire | `librarian@library.com` |
| Lecteur | `reader@library.com` |

📖 **Guide d'installation détaillé** : [`docs/guides/installation.md`](docs/guides/installation.md)

## 📁 Structure du projet

```
library-management/
├── backend/          # API REST (Express + Prisma + PostgreSQL)
├── frontend/          # Application React (Vite + Tailwind + shadcn/ui)
├── docs/              # Documentation complète (voir ci-dessous)
└── .github/workflows/ # CI/CD (GitHub Actions)
```

## 📚 Documentation

| Document | Contenu |
|---|---|
| [Guide d'installation](docs/guides/installation.md) | Installation locale, configuration, déploiement, dépannage |
| [Guide utilisateur](docs/guides/user-guide.md) | Utilisation de l'application côté adhérent |
| [Guide administrateur](docs/guides/admin-guide.md) | Opérations du personnel de la bibliothèque |
| [Diagramme de cas d'utilisation](docs/uml/use-case-diagram.md) | Acteurs et fonctionnalités |
| [Diagramme de classes](docs/uml/class-diagram.md) | Modèle objet du domaine |
| [Diagramme de séquence](docs/uml/sequence-diagram.md) | Flux détaillé d'un emprunt |
| [Diagramme d'activité](docs/uml/activity-diagram.md) | Cycle de vie complet d'un emprunt |
| [Diagramme de composants](docs/uml/component-diagram.md) | Architecture logicielle |
| [Diagramme de déploiement](docs/uml/deployment-diagram.md) | Infrastructure de production |
| [MER](docs/database/MER.md) / [MLD](docs/database/MLD.md) / [MPD](docs/database/MPD.md) | Modèle de données, du conceptuel au physique |
| [Documentation API (Swagger)](http://localhost:5000/api-docs) | Référence interactive des endpoints (serveur backend démarré) |
| [Journal de développement](docs/JOURNAL_DE_DEVELOPPEMENT.md) | Construction étape par étape, décisions de conception, résultats de tests |

## 🏗️ Principes d'architecture

- **Backend** : Clean Architecture en couches strictes — `routes → middlewares → controllers → services → repositories → Prisma`. Aucune requête base de données en dehors des repositories.
- **Frontend** : séparation `pages / components / services / hooks / contexts`, état serveur entièrement géré par TanStack Query (jamais dupliqué dans un state local).
- **Sécurité** : JWT en rotation, cookies httpOnly, RBAC par rôle et par permission, rate limiting, verrouillage de compte, journal d'audit.
- **Qualité** : TypeScript strict de bout en bout, 91 tests automatisés (68 backend + 23 frontend), CI GitHub Actions sur chaque push.

## 🧪 Tests

```bash
cd backend && npm test     # 68 tests (Jest + Supertest)
cd frontend && npx vitest run   # 23 tests (Vitest + Testing Library)
```

## 🗺️ Feuille de route / bonus

Fonctionnalités bonus envisagées pour une évolution future du projet (voir le journal de
développement pour le détail des arbitrages) : notifications temps réel (WebSockets), mode hors
ligne (PWA), moteur de recommandations, internationalisation, génération de cartes d'adhérent en
PDF, scanner de code-barres par caméra.

## 📄 Licence

Projet réalisé à des fins pédagogiques (soutenance universitaire) — MIT.
