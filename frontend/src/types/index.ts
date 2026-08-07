export type RoleName = 'ADMIN' | 'LIBRARIAN' | 'READER';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: RoleName;
  permissions: string[];
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  pagination?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  details?: { field?: string; message: string }[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
}

export interface Publisher {
  id: string;
  name: string;
  country: string | null;
  email: string | null;
  website: string | null;
}

export interface Author {
  id: string;
  name: string;
  photoUrl: string | null;
  nationality: string | null;
}

export type BookStatus = 'ACTIVE' | 'ARCHIVED' | 'OUT_OF_PRINT';
export type CopyStatus = 'AVAILABLE' | 'BORROWED' | 'RESERVED' | 'LOST' | 'DAMAGED' | 'MAINTENANCE' | 'WITHDRAWN';

export interface BookCopy {
  id: string;
  bookId: string;
  inventoryNumber: string;
  condition: string;
  location: string | null;
  status: CopyStatus;
}

export interface Book {
  id: string;
  isbn: string | null;
  title: string;
  subtitle: string | null;
  summary: string | null;
  year: number | null;
  language: string | null;
  callNumber: string | null;
  coverImageUrl: string | null;
  digitalFileUrl?: string | null;
  externalLink?: string | null;
  status: BookStatus;
  totalCopies: number;
  availableCopies: number;
  category: Category | null;
  publisher: Publisher | null;
  authors: { author: Author }[];
  copies: BookCopy[];
}

export type MemberStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'BLOCKED';
export type MemberType = 'STUDENT' | 'TEACHER' | 'STAFF' | 'EXTERNAL' | 'VIP';

export interface Member {
  id: string;
  userId: string;
  matricule: string;
  cardNumber: string | null;
  memberType: MemberType;
  status: MemberStatus;
  registrationDate: string;
  subscriptionExpiry: string | null;
  qrCode: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    avatarUrl: string | null;
  };
}

export type BorrowStatus = 'ONGOING' | 'RETURNED' | 'LATE' | 'LOST' | 'RENEWED';

export interface Borrow {
  id: string;
  memberId: string;
  bookCopyId: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: BorrowStatus;
  renewalCount: number;
  member?: Member;
  bookCopy?: BookCopy & { book: Book };
}

export type ReservationStatus = 'PENDING' | 'AVAILABLE' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';

export interface Reservation {
  id: string;
  memberId: string;
  bookId: string;
  reservationDate: string;
  expiryDate: string;
  status: ReservationStatus;
  book?: Book;
  member?: Member;
}

export type FineStatus = 'UNPAID' | 'PAID' | 'WAIVED' | 'PARTIALLY_PAID';

export interface Fine {
  id: string;
  borrowId: string;
  memberId: string;
  amount: number;
  reason: string | null;
  status: FineStatus;
  waivedReason: string | null;
  member?: Member;
  borrow?: Borrow;
}

export interface MemberPortal {
  id: string;
  matricule: string;
  cardNumber: string | null;
  qrCode: string | null;
  memberType: MemberType;
  status: MemberStatus;
  subscriptionExpiry: string | null;
  user: Member['user'];
  borrows: Array<Pick<Borrow, 'id' | 'dueDate' | 'status' | 'renewalCount'> & { bookCopy: { book: { id: string; title: string } } }>;
  reservations: Array<Pick<Reservation, 'id' | 'expiryDate' | 'status'> & { book: { id: string; title: string } }>;
  fines: Array<Pick<Fine, 'id' | 'amount' | 'reason' | 'status'> & { borrow: { bookCopy: { book: { id: string; title: string } } } }>;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface LibrarySettings {
  id: string;
  libraryName: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  borrowDurationDays: number;
  maxBorrowsPerUser: number;
  finePerDay: number;
}

export interface DashboardStats {
  books: {
    total: number;
    available: number;
    borrowed: number;
    reserved: number;
    lost: number;
    damaged: number;
  };
  circulation: {
    overdueBorrows: number;
    borrowsToday: number;
    returnsToday: number;
    pendingReservations: number;
  };
  finance: {
    collectedThisMonth: number;
  };
  members: {
    active: number;
    newThisMonth: number;
  };
  catalogMeta: {
    authors: number;
    categories: number;
    publishers: number;
  };
  monthlyBorrows: { month: string; borrows: number; returns: number }[];
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  user: { firstName: string; lastName: string } | null;
}
