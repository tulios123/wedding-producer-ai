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
      className="relative w-full max-w-[340px] h-[120px] rounded-2xl bg-bg-overlay border border-border-subtle overflow-hidden cursor-pointer"
    >
      <button
        onClick={(e) => { e.stopPropagation(); onHeartClick(); }}
        className="absolute top-2 left-2 z-10 rounded-full bg-black/30 backdrop-blur-sm p-1.5"
        aria-label={isFavorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
      >
        <Heart
          size={16}
          fill={isFavorite ? 'currentColor' : 'none'}
          strokeWidth={1.5}
          className={isFavorite ? 'text-accent-primary' : 'text-white'}
        />
      </button>

      <div className="flex h-full" style={{ direction: 'ltr' }}>
        <div className="relative w-[40%] h-full flex-shrink-0">
          <Image
            src={vendor.images[0]}
            alt={vendor.name}
            fill
            sizes="136px"
            style={{ objectFit: 'cover' }}
          />
        </div>

        <div className="flex-1 px-3 py-3 flex flex-col justify-center" style={{ direction: 'rtl' }}>
          <p className="text-base font-semibold text-text-primary leading-tight mb-1.5">{vendor.name}</p>
          <ul className="space-y-0.5">
            {vendor.bullets.slice(0, 3).map((bullet, i) => (
              <li key={i} className="text-xs text-text-secondary leading-tight flex gap-1">
                <span className="text-accent-primary flex-shrink-0">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
