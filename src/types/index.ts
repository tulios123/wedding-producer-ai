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

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type UpdateTag =
  | { type: 'profile'; field: keyof Profile; value: any }
  | { type: 'slot'; slot: SlotId; status: SlotStatus; vendor?: string; estimate?: { min: number; max: number }; amount?: number };
