'use client';

import { useState } from 'react';
import { VendorCard } from '@/components/VendorCard';

const VENDOR_IDS = ['venue-001', 'venue-002', 'venue-003'];

export default function DevCardsPage() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-4 p-6">
      {VENDOR_IDS.map(id => (
        <VendorCard
          key={id}
          vendorId={id}
          onTap={() => console.log('tapped', id)}
          onHeartClick={() => toggleFavorite(id)}
          isFavorite={favorites.has(id)}
        />
      ))}
    </div>
  );
}
