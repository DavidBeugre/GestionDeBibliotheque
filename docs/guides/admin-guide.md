# Guide administrateur / bibliothécaire

Ce guide couvre les opérations courantes du personnel de la bibliothèque. Rappel des rôles :

| Rôle | Peut faire |
|---|---|
| **Bibliothécaire** | Catalogue, adhérents, circulation (emprunts/réservations/amendes/paiements), rapports |
| **Administrateur** | Tout ce que peut faire un Bibliothécaire, + paramètres de la bibliothèque, journal d'audit |

## Gestion du catalogue

### Ajouter un livre
1. **Livres** → **Nouveau livre**
2. Renseigner titre, ISBN, catégorie, éditeur, année, cote, langue
3. Une fois le livre créé, ouvrir sa fiche pour :
   - Ajouter un ou plusieurs **exemplaires** (numéro d'inventaire auto-généré si laissé vide)
   - Téléverser une **couverture**
   - Générer un **QR Code** (utile pour l'étiquetage physique)

### Gérer les exemplaires
Chaque exemplaire a un statut indépendant (Disponible, Emprunté, Réservé, Perdu, Endommagé, En
maintenance). Un exemplaire endommagé ou en maintenance peut être marqué comme tel depuis la
fiche du livre, sans affecter les autres exemplaires du même titre.

### Archiver un livre
La suppression d'un livre est en réalité un **archivage** : le livre disparaît des résultats de
recherche actifs mais son historique (emprunts passés) reste intact. L'archivage est refusé si
des exemplaires sont actuellement empruntés.

## Gestion des adhérents

### Créer un adhérent
**Adhérents** → **Nouvel adhérent** → renseigner nom, prénom, email, type d'adhérent. Un compte
et un **mot de passe temporaire** sont générés automatiquement et envoyés par email avec le
matricule attribué. L'adhérent est invité à changer ce mot de passe à sa première connexion.

### Suspendre un adhérent
Utile en cas de non-respect du règlement. Un adhérent suspendu ne peut plus emprunter tant qu'il
n'est pas réactivé.

## Circulation

### Enregistrer un emprunt
**Emprunts** → **Nouvel emprunt** → rechercher l'adhérent, rechercher le livre, choisir un
exemplaire disponible. Le système vérifie automatiquement :
- Que l'adhérent est actif
- Qu'il n'a pas atteint sa limite d'emprunts simultanés (configurable, Paramètres)
- Qu'il n'a pas d'amende impayée

### Retour, renouvellement, perte
Depuis la liste des emprunts, chaque emprunt en cours propose :
- **Enregistrer le retour** — calcule automatiquement le retard éventuel et génère l'amende correspondante
- **Renouveler** — refusé si un autre adhérent attend ce livre, si une amende est impayée, ou au-delà de 2 renouvellements
- **Déclarer perdu** — génère une amende égale au prix d'achat du livre

### Réservations
Quand un livre est indisponible, une réservation peut être créée. Dès qu'un exemplaire se libère
(retour), il est automatiquement proposé au premier adhérent de la file d'attente (email +
notification), avec un délai de retrait avant que l'offre ne passe au suivant.

### Amendes et paiements
**Amendes** → sélectionner une amende impayée → **Encaisser** (paiement total ou partiel, avec
mode de paiement) ou **Remettre** (avec motif obligatoire, pour une remise gracieuse).

## Rapports

**Rapports** permet de consulter et d'exporter (CSV, Excel, PDF) :
- Livres les plus empruntés / jamais empruntés
- Emprunts en retard
- Amendes (avec filtre par période)
- Adhérents les plus actifs
- Activité d'une journée donnée
- Statistiques mensuelles sur une année

## Paramètres (Administrateur uniquement)

**Paramètres** permet de configurer :
- Nom, logo, coordonnées de la bibliothèque
- Durée d'emprunt par défaut (jours)
- Nombre maximal d'emprunts simultanés par adhérent
- Montant de l'amende journalière

Ces valeurs s'appliquent immédiatement à tous les nouveaux emprunts.

## Journal d'audit (Administrateur uniquement)

Trace toutes les actions sensibles : connexions (réussies/échouées), créations/modifications/
suppressions, avec horodatage, adresse IP et navigateur. Consultable via **Journal d'audit**,
filtrable par utilisateur, type d'action ou période — utile pour investiguer un incident de
sécurité ou un litige.
