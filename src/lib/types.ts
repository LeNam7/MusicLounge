export interface Room {
  id: string;
  slug: string;
  name: string;
  chineseName?: string;
  tagline: string;
  description: string;
  fullDescription: string;
  capacityMin: number;
  capacityMax: number;
  pricePerHour: number;
  pricePackage2h: number;
  areaSqm: number;
  floor: string;
  amenities: string[];
  images: string[];
  teaMasterIncluded: boolean;
  isActive: boolean;
  sortOrder: number;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'expired'
  | 'cancelled'
  | 'completed';

export type BookingStatusCode =
  | 'PENDING'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'COMPLETED';

export type SlotStatus = 'AVAILABLE' | 'PENDING' | 'CONFIRMED' | 'UNAVAILABLE';

export interface Booking {
  id: string;
  bookingReference: string;
  roomId: string;
  roomName?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationHours: number;
  guestCount: number;
  roomPrice: number;
  teaPackageId?: string;
  teaPackageName?: string;
  teaPackagePrice?: number;
  totalPrice: number;
  depositAmount: number;
  status: BookingStatus;
  statusCode: BookingStatusCode;
  specialRequests?: string;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  expiresAt?: string;
  expiredAt?: string;
  cancelledAt?: string;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeaPackage {
  id: string;
  name: string;
  vietnameseName: string;
  description: string;
  price: number;
  servings: string;
  origin: string;
  imageUrl: string;
  tags: string[];
  category?: 'luc-tra' | 'bach-tra' | 'hong-tra' | 'banh-tra' | 'combo';
  tasteNotes?: string;
  aroma?: string;
  liquorColor?: string;
  temperature?: string;
  steepingCount?: string;
  isHero?: boolean;
}

export interface BrandConfig {
  brandName: string;
  brandSubtitle: string;
  brandTagline: string;
  brandSubtagline: string;
  address: string;
  hotline: string;
  email: string;
  openTime: string;
  closeTime: string;
  slotIntervalMinutes: number;
  bufferMinutes: number;
  depositPercentage: number;
  holdDurationHours?: number;
  defaultDurationHours?: number;
}

export interface TimeSlot {
  time: string;
  endTime: string;
  status: SlotStatus;
  label: string;
  available: boolean;
  reason?: string;
  bookingId?: string;
  bookingReference?: string;
  customerName?: string;
}

export interface SlotBlock {
  id: string;
  roomId: string; // 'ALL' or specific roomId
  roomName?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface SystemSettings {
  openTime: string;
  closeTime: string;
  slotIntervalMinutes: number;
  defaultDurationHours: number;
  bufferMinutes: number;
  holdDurationHours: number;
  depositPercentage: number;
  closedDates: string[]; // Array of YYYY-MM-DD
  notifyCustomerOnExpiry: boolean;
}

export type NotificationType =
  | 'BOOKING_REQUESTED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_EXPIRED';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export type NotificationRecipientType = 'ADMIN' | 'CUSTOMER';

export type NotificationChannel = 'EMAIL' | 'ZALO_OA' | 'ZALO_ZNS' | 'ZALO_WEBHOOK' | 'EMAIL_WEBHOOK';

export interface NotificationLog {
  id: string;
  bookingId: string;
  bookingReference: string;
  recipientType: NotificationRecipientType;
  recipientAddress: string;
  channel: NotificationChannel;
  notificationType: NotificationType;
  title: string;
  content: string;
  payloadJson?: string;
  status: NotificationStatus;
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt?: string;
  lastError?: string;
  providerResponse?: string;
  sentAt?: string;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingAuditLog {
  id: string;
  bookingId: string;
  bookingReference: string;
  action: 'CREATED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED' | 'COMPLETED' | 'UPDATED';
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  actor: string;
  reason?: string;
  metadataJson?: string;
  createdAt: string;
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'SLOT_UNAVAILABLE'
  | 'BOOKING_EXPIRED'
  | 'INVALID_BOOKING_STATE'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'DATABASE_ERROR'
  | 'NOTIFICATION_ERROR';
