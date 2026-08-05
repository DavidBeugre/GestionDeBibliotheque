# Modèle Physique de Données (MPD)

Types PostgreSQL réels tels que générés par Prisma (`backend/prisma/schema.prisma`) — extrait des tables
centrales. Le script SQL complet est généré par `npx prisma migrate dev` (jamais écrit à la main :
Prisma reste la source de vérité du schéma, conformément aux bonnes pratiques du projet).

## Table `books`

| Colonne | Type PostgreSQL | Contraintes |
|---|---|---|
| id | `uuid` | PK, `DEFAULT gen_random_uuid()` |
| isbn | `varchar` | UNIQUE, NULL |
| title | `varchar` | NOT NULL |
| subtitle | `varchar` | NULL |
| summary | `text` | NULL |
| description | `text` | NULL |
| publisher_id | `uuid` | FK → publishers(id), NULL |
| category_id | `uuid` | FK → categories(id), NULL |
| year | `integer` | NULL |
| condition | `book_condition` (enum) | NOT NULL, DEFAULT 'NEW' |
| status | `book_status` (enum) | NOT NULL, DEFAULT 'ACTIVE' |
| price | `decimal(10,2)` | NULL |
| total_copies | `integer` | NOT NULL, DEFAULT 0 |
| available_copies | `integer` | NOT NULL, DEFAULT 0 |
| tags | `text[]` | NOT NULL, DEFAULT '{}' |
| keywords | `text[]` | NOT NULL, DEFAULT '{}' |
| created_at | `timestamp(3)` | NOT NULL, DEFAULT now() |
| updated_at | `timestamp(3)` | NOT NULL (auto-update Prisma) |

Index : `idx_books_category_id`, `idx_books_publisher_id`, `idx_books_status`, `idx_books_title`.

## Table `borrows`

| Colonne | Type PostgreSQL | Contraintes |
|---|---|---|
| id | `uuid` | PK |
| member_id | `uuid` | FK → members(id), NOT NULL |
| book_copy_id | `uuid` | FK → book_copies(id), NOT NULL |
| processed_by_id | `uuid` | FK → users(id), NULL |
| borrow_date | `timestamp(3)` | NOT NULL, DEFAULT now() |
| due_date | `timestamp(3)` | NOT NULL |
| return_date | `timestamp(3)` | NULL |
| status | `borrow_status` (enum) | NOT NULL, DEFAULT 'ONGOING' |
| renewal_count | `integer` | NOT NULL, DEFAULT 0 |

Index : `idx_borrows_member_id`, `idx_borrows_book_copy_id`, `idx_borrows_status`.

## Table `fines`

| Colonne | Type PostgreSQL | Contraintes |
|---|---|---|
| id | `uuid` | PK |
| borrow_id | `uuid` | FK → borrows(id), **UNIQUE**, NOT NULL |
| member_id | `uuid` | FK → members(id), NOT NULL |
| amount | `decimal(10,2)` | NOT NULL |
| status | `fine_status` (enum) | NOT NULL, DEFAULT 'UNPAID' |

## Table `payments`

| Colonne | Type PostgreSQL | Contraintes |
|---|---|---|
| id | `uuid` | PK |
| fine_id | `uuid` | FK → fines(id), NULL, **non unique** (paiements partiels multiples) |
| member_id | `uuid` | FK → members(id), NOT NULL |
| amount | `decimal(10,2)` | NOT NULL |
| method | `payment_method` (enum) | NOT NULL |
| paid_at | `timestamp(3)` | NOT NULL, DEFAULT now() |

Index : `idx_payments_member_id`, `idx_payments_fine_id`.

## Types énumérés PostgreSQL générés

```sql
CREATE TYPE "RoleName" AS ENUM ('ADMIN', 'LIBRARIAN', 'READER');
CREATE TYPE "BookStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'OUT_OF_PRINT');
CREATE TYPE "CopyStatus" AS ENUM ('AVAILABLE', 'BORROWED', 'RESERVED', 'LOST', 'DAMAGED', 'MAINTENANCE', 'WITHDRAWN');
CREATE TYPE "BorrowStatus" AS ENUM ('ONGOING', 'RETURNED', 'LATE', 'LOST', 'RENEWED');
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'AVAILABLE', 'FULFILLED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "FineStatus" AS ENUM ('UNPAID', 'PAID', 'WAIVED', 'PARTIALLY_PAID');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'MOBILE_MONEY', 'BANK_TRANSFER');
-- + MemberStatus, MemberType, Sex, BookCondition, NotificationType, AuditAction, AcquisitionSource
```

## Choix physiques notables

- **Clés primaires `uuid`** (pas d'auto-incrément entier) : évite l'énumération d'identifiants
  séquentiels par un tiers (ex. deviner l'ID du prochain adhérent créé), pertinent pour une API
  publique en lecture (catalogue).
- **`decimal(10,2)` pour tous les montants** (prix, amendes, paiements) — jamais `float`/`double`,
  qui introduirait des erreurs d'arrondi inacceptables sur des données financières.
- **Recherche texte** : pas d'index `GIN`/`tsvector` en base à ce stade (voir Étape 4 du journal de
  développement) — la recherche utilise `ILIKE` via Prisma, largement suffisant au volume d'un
  projet de soutenance ; l'ajout d'un index `GIN` PostgreSQL est documenté comme optimisation de
  production dans le journal.
- **Génération du script SQL** : `npx prisma migrate dev --name init` (Étape 2) produit le DDL complet
  dans `backend/prisma/migrations/`, versionné avec le code.
