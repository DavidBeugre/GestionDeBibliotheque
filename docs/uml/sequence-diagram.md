# Diagramme de séquence — Enregistrer un emprunt

Illustre l'échange complet entre le frontend, l'API et la base de données lors de la création
d'un emprunt (`POST /api/v1/borrows`), avec ses contrôles métier (Étape 6 du journal de développement).

```mermaid
sequenceDiagram
    actor B as Bibliothécaire
    participant FE as Frontend (React)
    participant API as API Express
    participant AUTH as Middleware Auth
    participant SVC as BorrowService
    participant DB as PostgreSQL (Prisma)

    B->>FE: Sélectionne adhérent + livre + exemplaire
    FE->>API: POST /borrows { memberId, bookCopyId }<br/>Authorization: Bearer <token>

    API->>AUTH: authenticate()
    AUTH->>AUTH: Vérifie le JWT
    AUTH-->>API: req.user = { id, role, permissions }

    API->>AUTH: requirePermission('borrow:manage')
    AUTH-->>API: OK (permission présente)

    API->>SVC: BorrowService.create({memberId, bookCopyId})

    SVC->>DB: findById(memberId)
    DB-->>SVC: Member { status: ACTIVE }

    alt Adhérent inactif
        SVC-->>API: 403 Forbidden
        API-->>FE: Erreur "compte non actif"
        FE-->>B: Toast d'erreur
    end

    SVC->>DB: findById(bookCopyId)
    DB-->>SVC: BookCopy { status: AVAILABLE }

    alt Exemplaire indisponible
        SVC-->>API: 409 Conflict
        API-->>FE: Erreur "non disponible"
    end

    SVC->>DB: countActiveBorrowsForMember(memberId)
    DB-->>SVC: count = 2

    SVC->>DB: countUnpaidFines(memberId)
    DB-->>SVC: count = 0

    alt Limite atteinte OU amende impayée
        SVC-->>API: 409 Conflict (message explicite)
        API-->>FE: Toast d'erreur métier
    end

    SVC->>DB: SettingsRepository.get()
    DB-->>SVC: { borrowDurationDays: 14 }

    SVC->>DB: Borrow.create({ dueDate: +14j })
    DB-->>SVC: Borrow créé

    SVC->>DB: BookCopy.update({ status: BORROWED })
    SVC->>DB: Book.recalculateCopyCounts(bookId)
    SVC->>DB: AuditLog.create() + ActivityLog.create()

    SVC-->>API: Borrow (avec relations)
    API-->>FE: 201 Created { data: borrow }
    FE-->>B: Toast "Emprunt enregistré", liste rafraîchie
```
