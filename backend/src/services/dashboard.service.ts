import { prisma } from '../config/database';

function startOfDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthRange(monthsAgo: number): { start: Date; end: Date; label: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);
  const label = start.toLocaleDateString('fr-FR', { month: 'short' });
  return { start, end, label };
}

export class DashboardService {
  static async getStats() {
    const [
      totalBooks,
      availableCopies,
      borrowedCopies,
      reservedCopies,
      lostCopies,
      damagedCopies,
      overdueBorrows,
      borrowsToday,
      returnsToday,
      finesCollectedAgg,
      activeMembers,
      newMembersThisMonth,
      authorsCount,
      categoriesCount,
      publishersCount,
      pendingReservations,
    ] = await Promise.all([
      prisma.book.count(),
      prisma.bookCopy.count({ where: { status: 'AVAILABLE' } }),
      prisma.bookCopy.count({ where: { status: 'BORROWED' } }),
      prisma.bookCopy.count({ where: { status: 'RESERVED' } }),
      prisma.bookCopy.count({ where: { status: 'LOST' } }),
      prisma.bookCopy.count({ where: { status: 'DAMAGED' } }),
      prisma.borrow.count({ where: { status: { in: ['ONGOING', 'LATE'] }, dueDate: { lt: new Date() } } }),
      prisma.borrow.count({ where: { borrowDate: { gte: startOfDay() } } }),
      prisma.borrow.count({ where: { returnDate: { gte: startOfDay() } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: startOfMonth() } } }),
      prisma.member.count({ where: { status: 'ACTIVE' } }),
      prisma.member.count({ where: { registrationDate: { gte: startOfMonth() } } }),
      prisma.author.count(),
      prisma.category.count(),
      prisma.publisher.count(),
      prisma.reservation.count({ where: { status: 'PENDING' } }),
    ]);

    // 6 derniers mois — requêtes simples et portables plutôt qu'un date_trunc SQL brut,
    // largement suffisant à l'échelle de démonstration d'un projet de soutenance.
    const months = [5, 4, 3, 2, 1, 0].map((m) => monthRange(m));
    const monthlyBorrows = await Promise.all(
      months.map(async ({ start, end, label }) => ({
        month: label,
        borrows: await prisma.borrow.count({ where: { borrowDate: { gte: start, lt: end } } }),
        returns: await prisma.borrow.count({ where: { returnDate: { gte: start, lt: end } } }),
      }))
    );

    return {
      books: {
        total: totalBooks,
        available: availableCopies,
        borrowed: borrowedCopies,
        reserved: reservedCopies,
        lost: lostCopies,
        damaged: damagedCopies,
      },
      circulation: {
        overdueBorrows,
        borrowsToday,
        returnsToday,
        pendingReservations,
      },
      finance: {
        collectedThisMonth: Number(finesCollectedAgg._sum.amount ?? 0),
      },
      members: {
        active: activeMembers,
        newThisMonth: newMembersThisMonth,
      },
      catalogMeta: {
        authors: authorsCount,
        categories: categoriesCount,
        publishers: publishersCount,
      },
      monthlyBorrows,
    };
  }
}
