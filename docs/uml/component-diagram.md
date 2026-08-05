# Diagramme de composants

```mermaid
graph TB
    subgraph "Frontend (Vite + React 19 + TypeScript)"
        UI[Pages & Composants UI<br/>shadcn/ui, Tailwind]
        RQ[TanStack Query<br/>cache & synchronisation serveur]
        RC[React Router<br/>routes protégées par rôle]
        AX[Axios Client<br/>+ refresh automatique du token]
        CTX[Contexts<br/>Auth, Theme]
    end

    subgraph "Backend (Node.js + Express + TypeScript)"
        ROUTES[Routes<br/>validation express-validator]
        MW[Middlewares<br/>auth, rbac, rate-limit, erreurs]
        CTRL[Controllers]
        SVC[Services<br/>logique métier]
        REPO[Repositories<br/>accès Prisma]
        PRISMA[Prisma ORM]
    end

    subgraph "Services externes"
        PG[(PostgreSQL - Neon)]
        CLOUD[Cloudinary - images]
        SMTP[SMTP - Nodemailer]
    end

    UI --> RQ
    UI --> RC
    RQ --> AX
    UI --> CTX
    CTX --> AX

    AX -->|HTTPS / JSON| ROUTES
    ROUTES --> MW
    MW --> CTRL
    CTRL --> SVC
    SVC --> REPO
    REPO --> PRISMA
    PRISMA --> PG

    SVC -->|upload images| CLOUD
    SVC -->|envoi d'emails| SMTP

    style UI fill:#E8F3EE,stroke:#0F4A37
    style SVC fill:#E8F3EE,stroke:#0F4A37
    style PG fill:#FBF3E3,stroke:#B08D57
```

## Description des composants

| Composant | Responsabilité |
|---|---|
| **Pages & Composants UI** | Rendu, interactions utilisateur, formulaires (React Hook Form + Zod) |
| **TanStack Query** | Cache, invalidation, états de chargement/erreur, synchronisation avec le serveur |
| **Axios Client** | Requêtes HTTP, injection du token, rotation automatique sur 401 |
| **Routes (Express)** | Définition des endpoints REST, validation des entrées |
| **Middlewares** | Authentification JWT, autorisation RBAC, rate limiting, gestion centralisée des erreurs |
| **Services** | Toute la logique métier (règles d'emprunt, calcul d'amendes, file d'attente...) |
| **Repositories** | Seule couche autorisée à interroger Prisma — isole le reste de l'app du client ORM |
| **Prisma ORM** | Typage des requêtes, migrations, génération du client |
