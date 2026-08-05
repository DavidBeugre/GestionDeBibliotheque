# Modèle Entité-Association (MER)

```mermaid
erDiagram
    ROLE ||--o{ USER : "possède"
    ROLE }o--o{ PERMISSION : "accorde"
    USER ||--o{ SESSION : "ouvre"
    USER ||--o| MEMBER : "est aussi"
    USER ||--o{ NOTIFICATION : "reçoit"
    USER ||--o{ AUDIT_LOG : "génère"
    USER ||--o{ ACTIVITY_LOG : "génère"
    USER ||--o{ ATTACHMENT : "téléverse"

    BOOK ||--o{ BOOK_COPY : "possède"
    BOOK }o--o{ AUTHOR : "écrit par (BOOK_AUTHOR)"
    BOOK }o--o| PUBLISHER : "édité par"
    BOOK }o--o| CATEGORY : "classé dans"
    BOOK ||--o{ RESERVATION : "réservé via"
    BOOK ||--o{ ATTACHMENT : "documents liés"

    MEMBER ||--o{ BORROW : "effectue"
    MEMBER ||--o{ RESERVATION : "effectue"
    MEMBER ||--o{ FINE : "encourt"
    MEMBER ||--o{ PAYMENT : "effectue"

    BOOK_COPY ||--o{ BORROW : "concerné par"
    BORROW ||--o| FINE : "génère"
    FINE ||--o{ PAYMENT : "réglée par (paiements partiels possibles)"

    ROLE {
        uuid id PK
        string name
        string description
    }
    PERMISSION {
        uuid id PK
        string code
        string description
    }
    USER {
        uuid id PK
        string email UK
        string password
        string firstName
        string lastName
        uuid roleId FK
        boolean isActive
    }
    SESSION {
        uuid id PK
        uuid userId FK
        string refreshToken UK
        datetime expiresAt
    }
    MEMBER {
        uuid id PK
        uuid userId FK "UK"
        string matricule UK
        string cardNumber UK
        string memberType
        string status
    }
    BOOK {
        uuid id PK
        string isbn UK
        string title
        uuid categoryId FK
        uuid publisherId FK
        int totalCopies
        int availableCopies
    }
    BOOK_COPY {
        uuid id PK
        uuid bookId FK
        string inventoryNumber UK
        string status
    }
    AUTHOR {
        uuid id PK
        string name
    }
    PUBLISHER {
        uuid id PK
        string name
    }
    CATEGORY {
        uuid id PK
        string name UK
    }
    BORROW {
        uuid id PK
        uuid memberId FK
        uuid bookCopyId FK
        datetime dueDate
        datetime returnDate
        string status
    }
    RESERVATION {
        uuid id PK
        uuid memberId FK
        uuid bookId FK
        datetime expiryDate
        string status
    }
    FINE {
        uuid id PK
        uuid borrowId FK "UK"
        uuid memberId FK
        decimal amount
        string status
    }
    PAYMENT {
        uuid id PK
        uuid fineId FK "nullable"
        uuid memberId FK
        decimal amount
        string method
    }
    NOTIFICATION {
        uuid id PK
        uuid userId FK
        string type
        boolean isRead
    }
    AUDIT_LOG {
        uuid id PK
        uuid userId FK
        string action
        string ipAddress
    }
    ACTIVITY_LOG {
        uuid id PK
        uuid userId FK
        string action
        string description
    }
    ATTACHMENT {
        uuid id PK
        uuid uploadedById FK
        uuid bookId FK
        string fileUrl
    }
```

> Le modèle complet (20 entités, avec toutes les colonnes) est disponible dans
> [`backend/prisma/schema.prisma`](../../backend/prisma/schema.prisma), qui reste la **source de vérité**
> — ce diagramme est une vue simplifiée à but pédagogique.
