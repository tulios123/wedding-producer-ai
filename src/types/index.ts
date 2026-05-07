export type SlotStatus = 'idle' | 'collecting' | 'negotiating' | 'hold' | 'signed';
export type SlotId = 'venue' | 'photography' | 'catering';
export type PlaceholderSlotId = 'music' | 'dress' | 'makeup' | 'decor' | 'rabbi';

export interface Slot {
  id: SlotId;
  label: string;
  status: SlotStatus;
  vendor?: string;
  estimate?: { min: number; max: number };
  amount?: number;
}

export interface Profile {
  partner1?: string;
  partner2?: string;
  weddingDate?: string;
  guestCount?: number;
  budget?: number;
  style?: string;
  location?: string;
  ceremonyType?: 'rabbinate' | 'reform' | 'civil' | 'destination';
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type UpdateTag =
  | { type: 'profile'; field: keyof Profile; value: any }
  | { type: 'slot'; slot: SlotId; status: SlotStatus; vendor?: string; estimate?: { min: number; max: number }; amount?: number }
  | { type: 'navigation'; action: 'go_to_dashboard' };

export interface VendorDetails {
  capacity?: { min: number; max: number };
  type?: string;
  kashrut?: string;
  parking?: boolean;
  pricePerPerson?: { min: number; max: number };
  cuisineStyle?: string;
  dietary?: string[];
  style?: string;
  package?: string;
  deliverables?: string[];
  experience?: number;
}

export interface Vendor {
  id: string;
  name: string;
  category: 'venue' | 'catering' | 'photography';
  region: string;
  priceRange: { min: number; max: number };
  style: string[];
  description: string;
  bullets: string[];
  images: string[];
  details: VendorDetails;
}
