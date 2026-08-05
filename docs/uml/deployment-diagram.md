# Diagramme de déploiement

```mermaid
graph TB
    subgraph "Poste client"
        Browser[Navigateur web<br/>Application React]
    end

    subgraph "Vercel"
        FE[Frontend statique<br/>build Vite - dist/]
    end

    subgraph "Render"
        BE[Backend Node.js/Express<br/>conteneur - API REST]
    end

    subgraph "Neon"
        DB[(PostgreSQL<br/>base de données managée)]
    end

    subgraph "Cloudinary"
        CDN[Stockage & CDN images]
    end

    subgraph "Fournisseur SMTP"
        Mail[Service d'envoi d'emails]
    end

    Browser -->|HTTPS| FE
    Browser -->|HTTPS / fetch API| BE
    FE -.->|proxy /api en dev<br/>appel direct en prod| BE
    BE -->|connexion chiffrée<br/>Prisma| DB
    BE -->|upload/API| CDN
    BE -->|SMTP| Mail

    style FE fill:#E8F3EE,stroke:#0F4A37
    style BE fill:#E8F3EE,stroke:#0F4A37
    style DB fill:#FBF3E3,stroke:#B08D57
```

## Notes de déploiement

| Environnement | Plateforme | Détails |
|---|---|---|
| Frontend | **Vercel** | Build statique (`npm run build`), variable `VITE_API_URL` pointant vers l'API Render |
| Backend | **Render** | Service web Node.js, variables d'environnement (`.env` — voir guide d'installation), health check sur `/health` |
| Base de données | **Neon PostgreSQL** | Connexion via `DATABASE_URL`/`DIRECT_URL`, migrations Prisma exécutées au déploiement (`prisma migrate deploy`) |
| Stockage images | **Cloudinary** | Couvertures de livres, photos d'adhérents/auteurs, logo, QR codes |
| Emails | **SMTP** (ex. Gmail, SendGrid) | Réinitialisation de mot de passe, identifiants adhérents, rappels de retard |

Le frontend et le backend sont déployés indépendamment (repos ou dossiers séparés dans le même monorepo),
ce qui permet de les faire évoluer et scaler séparément — cohérent avec la séparation stricte posée
dès l'Étape 1 du projet.
