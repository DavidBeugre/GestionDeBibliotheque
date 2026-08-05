# Modèle Logique de Données (MLD)

Notation relationnelle : `TABLE(clé primaire soulignée, ..., #clé_étrangère)`.

```
roles(id, name, description)

permissions(id, code, description)

_RolePermissions(roleId #roles.id, permissionId #permissions.id)          -- table de jointure implicite (Prisma many-to-many)

users(id, email, password, firstName, lastName, phone, avatarUrl,
      #roleId, isActive, isEmailVerified, failedLoginCount, lockedUntil,
      lastLoginAt, passwordChangedAt, resetPasswordToken, resetPasswordExpires,
      twoFactorEnabled, twoFactorSecret)

sessions(id, #userId, refreshToken, userAgent, ipAddress, isRevoked, expiresAt)

members(id, #userId, matricule, sex, birthDate, address, profession,
        memberType, registrationDate, subscriptionExpiry, cardNumber, qrCode, status)

categories(id, name, description, color, icon)

publishers(id, name, address, phone, email, country, website)

authors(id, name, photoUrl, nationality, birthDate, deathDate, biography, website)

books(id, isbn, title, subtitle, summary, description, #publisherId, #categoryId,
      collection, edition, year, pageCount, language, callNumber, location,
      condition, status, price, purchaseDate, acquisitionSource,
      totalCopies, availableCopies, coverImageUrl, barcode, qrCode,
      digitalFileUrl, externalLink, tags[], keywords[])

book_authors(#bookId, #authorId)                                          -- association Book <-> Author

book_copies(id, #bookId, inventoryNumber, condition, location, status)

borrows(id, #memberId, #bookCopyId, #processedById, borrowDate, dueDate,
        returnDate, status, renewalCount, observations)

reservations(id, #memberId, #bookId, reservationDate, expiryDate, status, notifiedAt)

fines(id, #borrowId [UK], #memberId, amount, reason, status, waivedReason)

payments(id, #fineId [nullable], #memberId, #processedById, amount,
         method, reference, receiptUrl, paidAt)

notifications(id, #userId, type, title, message, link, isRead)

activity_logs(id, #userId [nullable], action, entityType, entityId, description)

audit_logs(id, #userId [nullable], action, entityType, entityId, ipAddress,
           userAgent, metadata)

library_settings(id, libraryName, logoUrl, address, phone, email, currency,
                  borrowDurationDays, maxBorrowsPerUser, finePerDay, holidays)

attachments(id, fileName, fileUrl, fileType, fileSizeBytes, #uploadedById,
            #bookId [nullable], relatedType, relatedId)
```

## Règles de gestion traduites en contraintes

- `users.email`, `members.matricule`, `members.cardNumber`, `books.isbn`, `books.barcode`,
  `book_copies.inventoryNumber`, `categories.name`, `permissions.code`, `roles.name`,
  `sessions.refreshToken` → **contraintes d'unicité (UK)**.
- `fines.borrowId` est **unique** : une amende naît toujours d'un emprunt précis, jamais partagée.
- `payments.fineId` est **nullable, non unique** : un paiement peut solder une amende, et une amende
  peut recevoir **plusieurs** paiements successifs (paiements partiels, Étape 6) — leur somme est
  contrôlée au niveau applicatif (`PaymentService`) plutôt que par une contrainte SQL, afin de ne
  jamais dépasser le montant dû tout en autorisant un règlement échelonné.
  > 🔧 **Correction apportée à cette étape** : le schéma initial (Étape 2) posait par erreur
  > `fineId String? @unique`, ce qui aurait interdit un deuxième paiement partiel dès le premier
  > enregistré — en contradiction avec la logique de paiement partiel construite à l'Étape 6.
  > La contrainte d'unicité a été retirée et un index simple ajouté à la place ; les 68 tests
  > backend ont été revérifiés après correction (toujours au vert).
- `members.userId` est **unique** : relation 1-1 stricte avec `users`.
