'use client';

import Image from 'next/image';
import { Heart } from 'lucide-react';
import vendorsData from '@/data/vendors.json';
import type { Vendor } from '@/types';

interface VendorCardProps {
  vendorId: string;
  onTap: () => void;
  onHeartClick: () => void;
  isFavorite: boolean;
}

export function VendorCard({ vendorId, onTap, onHeartClick, isFavorite }: VendorCardProps) {
  const vendor = (vendorsData.vendors as Vendor[]).find(v => v.id === vendorId);

  if (!vendor) return null;

  return (
    <div
      onClick={onTap}
      className="relative w-full rounded-2xl overflow-hidden cursor-pointer"
      style={{ backgroundColor: '#1C1828', boxShadow: '0 2px 12px rgba(0,0,0,0.4)', height: '112px', display: 'flex' }}
    >
      {/* Image */}
      <div className="relative flex-shrink-0" style={{ width: '38%' }}>
        <Image src={vendor.images[0]} alt={vendor.name} fill sizes="140px" style={{ objectFit: 'cover' }} />
        {/* Heart */}
        <button
          onClick={(e) => { e.stopPropagation(); onHeartClick(); }}
          className="absolute top-2 left-2 z-10 rounded-full p-1.5"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', border: 'none', cursor: 'pointer' }}
        >
          <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={1.5} style={{ color: isFavorite ? '#E8A87C' : 'white' }} />
        </button>
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-center" style={{ padding: '12px 14px', direction: 'rtl' }}>
        <p style={{ color: '#F5F0E8', fontSize: '15px', fontWeight: '600', marginBottom: '6px', letterSpacing: '-0.2px' }}>
          {vendor.name}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {vendor.bullets.slice(0, 3).map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
              <span style={{ color: '#E8A87C', fontSize: '11px', flexShrink: 0, marginTop: '1px' }}>•</span>
              <span style={{ color: 'rgba(245,240,232,0.5)', fontSize: '11px', lineHeight: 1.4 }}>{b}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
