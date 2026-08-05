import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { ReportColumn, ReportRow } from '../utils/export.util';

export type ReportType =
  | 'popular-books'
  | 'never-borrowed'
  | 'overdue'
  | 'fines'
  | 'active-members'
  | 'daily-activity'
  | 'annual-stats';

export interface ReportData {
  title: string;
  columns: ReportColumn[];
  rows: ReportRow[];
  summary?: Record<string, number>;
}

function startOfDayUtc(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDayUtc(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export class ReportService {
  static async getData(type: ReportType, query: Record<string, string | undefined>): Promise<ReportData> {
    switch (type) {
      case 'popular-books':
        return this.popularBooks(Number(query.limit) || 20);
      case 'never-borrowed':
        return this.neverBorrowed();
      case 'overdue':
        return this.overdue();
      case 'fines':
        return this.fines(query.dateFrom, query.dateTo);
      case 'active-members':
        return this.activeMembers(Number(query.limit) || 20);
      case 'daily-activity':
        return this.dailyActivity(query.date);
      case 'annual-stats':
        return this.annualStats(Number(query.year) || new Date().getFullYear());
      default:
        throw ApiError.badRequest(`Type de rapport inconnu : ${type}`);
    }
  }

  private static async popularBooks(limit: number): Promise<ReportData> {
    const borrows = await prisma.borrow.findMany({
      include: { bookCopy: { include: { book: { include: { authors: { include: { author: true } } } } } } },
    });

    const counts = new Map<string, { title: string; author: string; count: number }>();
    for (const b of borrows) {
      const book = b.bookCopy.book;
      const entry = counts.get(book.id);
      const author = book.authors[0]?.author.name ?? '—';
      if (entry) entry.count += 1;
      else counts.set(book.id, { title: book.title, author, count: 1 });
    }

    const rows = [...counts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((r) => ({ title: r.title, author: r.author, borrowCount: r.count }));

    return {
      title: 'Livres les plus empruntés',
      columns: [
        { key: 'title', label: 'Titre' },
        { key: 'author', label: 'Auteur' },
        { key: 'borrowCount', label: 'Emprunts' },
      ],
      rows,
    };
  }

  private static async neverBorrowed(): Promise<ReportData> {
    const books = await prisma.book.findMany({
      where: { copies: { every: { borrows: { none: {} } } } },
      orderBy: { createdAt: 'desc' },
      include: { authors: { include: { author: true } } },
    });

    return {
      title: 'Livres jamais empruntés',
      columns: [
        { key: 'title', label: 'Titre' },
        { key: 'isbn', label: 'ISBN' },
        { key: 'addedAt', label: 'Ajouté le' },
      ],
      rows: books.map((b: any) => ({
        title: b.title,
        isbn: b.isbn ?? '—',
        addedAt: b.createdAt.toLocaleDateString('fr-FR'),
      })),
    };
  }

  private static async overdue(): Promise<ReportData> {
    const borrows = await prisma.borrow.findMany({
      where: { status: { in: ['ONGOING', 'LATE'] }, dueDate: { lt: new Date() } },
      include: {
        member: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        bookCopy: { include: { book: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    return {
      title: 'Emprunts en retard',
      columns: [
        { key: 'member', label: 'Adhérent' },
        { key: 'email', label: 'Email' },
        { key: 'book', label: 'Livre' },
        { key: 'dueDate', label: 'Échéance' },
        { key: 'daysLate', label: 'Jours de retard' },
      ],
      rows: borrows.map((b: any) => ({
        member: `${b.member.user.firstName} ${b.member.user.lastName}`,
        email: b.member.user.email,
        book: b.bookCopy.book.title,
        dueDate: b.dueDate.toLocaleDateString('fr-FR'),
        daysLate: Math.ceil((now.getTime() - b.dueDate.getTime()) / 86_400_000),
      })),
    };
  }

  private static async fines(dateFrom?: string, dateTo?: string): Promise<ReportData> {
    const where = {
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom ? { gte: startOfDayUtc(new Date(dateFrom)) } : {}),
              ...(dateTo ? { lte: endOfDayUtc(new Date(dateTo)) } : {}),
            },
          }
        : {}),
    };

    const fines = await prisma.fine.findMany({
      where,
      include: { member: { include: { user: { select: { firstName: true, lastName: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    const summary = {
      total: fines.reduce((sum: number, f: any) => sum + Number(f.amount), 0),
      unpaid: fines.filter((f: any) => f.status === 'UNPAID' || f.status === 'PARTIALLY_PAID').reduce((s: number, f: any) => s + Number(f.amount), 0),
      paid: fines.filter((f: any) => f.status === 'PAID').reduce((s: number, f: any) => s + Number(f.amount), 0),
      waived: fines.filter((f: any) => f.status === 'WAIVED').reduce((s: number, f: any) => s + Number(f.amount), 0),
    };

    return {
      title: 'Rapport des amendes',
      columns: [
        { key: 'member', label: 'Adhérent' },
        { key: 'amount', label: 'Montant' },
        { key: 'status', label: 'Statut' },
        { key: 'reason', label: 'Motif' },
        { key: 'createdAt', label: 'Date' },
      ],
      rows: fines.map((f: any) => ({
        member: `${f.member.user.firstName} ${f.member.user.lastName}`,
        amount: Number(f.amount),
        status: f.status,
        reason: f.reason ?? '—',
        createdAt: f.createdAt.toLocaleDateString('fr-FR'),
      })),
      summary,
    };
  }

  private static async activeMembers(limit: number): Promise<ReportData> {
    const members = await prisma.member.findMany({
      where: { status: 'ACTIVE' },
      include: { user: { select: { firstName: true, lastName: true, email: true } }, _count: { select: { borrows: true } } },
      orderBy: { borrows: { _count: 'desc' } },
      take: limit,
    });

    return {
      title: 'Adhérents les plus actifs',
      columns: [
        { key: 'name', label: 'Adhérent' },
        { key: 'email', label: 'Email' },
        { key: 'borrowCount', label: "Nombre d'emprunts" },
      ],
      rows: members.map((m: any) => ({
        name: `${m.user.firstName} ${m.user.lastName}`,
        email: m.user.email,
        borrowCount: m._count.borrows,
      })),
    };
  }

  private static async dailyActivity(dateStr?: string): Promise<ReportData> {
    const date = dateStr ? new Date(dateStr) : new Date();
    const from = startOfDayUtc(date);
    const to = endOfDayUtc(date);

    const [borrows, returns] = await Promise.all([
      prisma.borrow.findMany({
        where: { borrowDate: { gte: from, lte: to } },
        include: { member: { include: { user: true } }, bookCopy: { include: { book: true } } },
      }),
      prisma.borrow.findMany({
        where: { returnDate: { gte: from, lte: to } },
        include: { member: { include: { user: true } }, bookCopy: { include: { book: true } } },
      }),
    ]);

    const rows: ReportRow[] = [
      ...borrows.map((b: any) => ({
        type: 'Emprunt',
        member: `${b.member.user.firstName} ${b.member.user.lastName}`,
        book: b.bookCopy.book.title,
        time: b.borrowDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      })),
      ...returns.map((b: any) => ({
        type: 'Retour',
        member: `${b.member.user.firstName} ${b.member.user.lastName}`,
        book: b.bookCopy.book.title,
        time: b.returnDate!.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      })),
    ];

    return {
      title: `Activité du ${date.toLocaleDateString('fr-FR')}`,
      columns: [
        { key: 'type', label: 'Type' },
        { key: 'member', label: 'Adhérent' },
        { key: 'book', label: 'Livre' },
        { key: 'time', label: 'Heure' },
      ],
      rows,
      summary: { borrows: borrows.length, returns: returns.length },
    };
  }

  private static async annualStats(year: number): Promise<ReportData> {
    const months = Array.from({ length: 12 }, (_, i) => i);
    const rows = await Promise.all(
      months.map(async (m) => {
        const start = new Date(year, m, 1);
        const end = new Date(year, m + 1, 1);
        const [borrows, returns, newMembers, finesAgg] = await Promise.all([
          prisma.borrow.count({ where: { borrowDate: { gte: start, lt: end } } }),
          prisma.borrow.count({ where: { returnDate: { gte: start, lt: end } } }),
          prisma.member.count({ where: { registrationDate: { gte: start, lt: end } } }),
          prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: start, lt: end } } }),
        ]);
        return {
          month: start.toLocaleDateString('fr-FR', { month: 'long' }),
          borrows,
          returns,
          newMembers,
          finesCollected: Number(finesAgg._sum.amount ?? 0),
        };
      })
    );

    return {
      title: `Statistiques annuelles ${year}`,
      columns: [
        { key: 'month', label: 'Mois' },
        { key: 'borrows', label: 'Emprunts' },
        { key: 'returns', label: 'Retours' },
        { key: 'newMembers', label: 'Nouveaux adhérents' },
        { key: 'finesCollected', label: 'Amendes encaissées' },
      ],
      rows,
    };
  }
}
