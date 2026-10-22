export interface Room {
  id: string;
  slug: string;
  name: string;
  chineseName: string;
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

export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';

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
  specialRequests?: string;
  adminNotes?: string;
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
}

export interface BrandConfig {
  brandName: string;
  brandChineseName: string;
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
}

export interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}
