import { PrismaClient, RoleName, MemberType, AcquisitionSource } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PERMISSIONS: { code: string; description: string }[] = [
  { code: 'book:create', description: 'Créer un livre' },
  { code: 'book:read', description: 'Consulter les livres' },
  { code: 'book:update', description: 'Modifier un livre' },
  { code: 'book:delete', description: 'Supprimer un livre' },
  { code: 'member:manage', description: 'Gérer les adhérents' },
  { code: 'borrow:manage', description: 'Gérer les emprunts' },
  { code: 'fine:manage', description: 'Gérer les amendes' },
  { code: 'report:view', description: 'Consulter les rapports' },
  { code: 'settings:manage', description: 'Gérer les paramètres' },
  { code: 'user:manage', description: 'Gérer les utilisateurs et rôles' },
];

const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  ADMIN: PERMISSIONS.map((p) => p.code),
  LIBRARIAN: [
    'book:create',
    'book:read',
    'book:update',
    'member:manage',
    'borrow:manage',
    'fine:manage',
    'report:view',
  ],
  READER: ['book:read'],
};

async function main() {
  console.log('🌱 Démarrage du seed...');

  // ---------- Permissions ----------
  await Promise.all(
    PERMISSIONS.map((p) =>
      prisma.permission.upsert({ where: { code: p.code }, update: {}, create: p })
    )
  );

  // ---------- Rôles ----------
  for (const roleName of Object.values(RoleName)) {
    const permissionCodes = ROLE_PERMISSIONS[roleName];
    await prisma.role.upsert({
      where: { name: roleName },
      update: {
        permissions: { set: permissionCodes.map((code) => ({ code })) },
      },
      create: {
        name: roleName,
        description: `Rôle ${roleName}`,
        permissions: { connect: permissionCodes.map((code) => ({ code })) },
      },
    });
  }

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'ADMIN' } });
  const librarianRole = await prisma.role.findUniqueOrThrow({ where: { name: 'LIBRARIAN' } });
  const readerRole = await prisma.role.findUniqueOrThrow({ where: { name: 'READER' } });

  // ---------- Utilisateurs de démonstration ----------
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@library.com' },
    update: {},
    create: {
      email: 'admin@library.com',
      password: passwordHash,
      firstName: 'Amina',
      lastName: 'Koné',
      roleId: adminRole.id,
      isEmailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'librarian@library.com' },
    update: {},
    create: {
      email: 'librarian@library.com',
      password: passwordHash,
      firstName: 'Yao',
      lastName: 'Kouassi',
      roleId: librarianRole.id,
      isEmailVerified: true,
    },
  });

  const readerUser = await prisma.user.upsert({
    where: { email: 'reader@library.com' },
    update: {},
    create: {
      email: 'reader@library.com',
      password: passwordHash,
      firstName: 'Fatou',
      lastName: 'Diarra',
      roleId: readerRole.id,
      isEmailVerified: true,
    },
  });

  await prisma.member.upsert({
    where: { userId: readerUser.id },
    update: {},
    create: {
      userId: readerUser.id,
      matricule: 'ADH-0001',
      memberType: MemberType.STUDENT,
      cardNumber: 'CARD-0001',
      subscriptionExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    },
  });

  // ---------- Catégories ----------
  const categories = await Promise.all(
    [
      { name: 'Roman', color: '#6366F1', icon: 'book-open' },
      { name: 'Science-Fiction', color: '#8B5CF6', icon: 'rocket' },
      { name: 'Informatique', color: '#0EA5E9', icon: 'cpu' },
      { name: 'Histoire', color: '#F59E0B', icon: 'landmark' },
      { name: 'Jeunesse', color: '#10B981', icon: 'baby' },
    ].map((c) => prisma.category.upsert({ where: { name: c.name }, update: {}, create: c }))
  );

  // ---------- Éditeurs ----------
  const publisher = await prisma.publisher.create({
    data: { name: 'Éditions Nouvelle Plume', country: 'Côte d’Ivoire', email: 'contact@nouvelleplume.ci' },
  });

  // ---------- Auteurs ----------
  const author = await prisma.author.create({
    data: { name: 'Ahmadou Kourouma', nationality: 'Ivoirienne', biography: 'Écrivain ivoirien majeur.' },
  });

  // ---------- Livre de démonstration ----------
  const book = await prisma.book.create({
    data: {
      isbn: '978-2-07-036822-8',
      title: 'Les Soleils des indépendances',
      summary: "Roman emblématique de la littérature africaine francophone.",
      categoryId: categories[0].id,
      publisherId: publisher.id,
      year: 1968,
      language: 'Français',
      callNumber: 'ROM-KOU-001',
      totalCopies: 3,
      availableCopies: 3,
      acquisitionSource: AcquisitionSource.PURCHASE,
      authors: { create: [{ authorId: author.id }] },
      copies: {
        create: [
          { inventoryNumber: 'INV-000001' },
          { inventoryNumber: 'INV-000002' },
          { inventoryNumber: 'INV-000003' },
        ],
      },
    },
  });

  // ---------- Paramètres de la bibliothèque ----------
  await prisma.librarySettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      libraryName: 'Bibliothèque Universitaire Centrale',
      currency: 'XOF',
      borrowDurationDays: 14,
      maxBorrowsPerUser: 3,
      finePerDay: 100,
    },
  });

  console.log('✅ Seed terminé avec succès');
  console.log(`   - Admin      : admin@library.com / Password123!`);
  console.log(`   - Librarian  : librarian@library.com / Password123!`);
  console.log(`   - Reader     : reader@library.com / Password123!`);
  console.log(`   - Livre créé : "${book.title}"`);
  console.log(`   - Créé par   : ${admin.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur pendant le seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
