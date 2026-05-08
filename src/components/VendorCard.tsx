'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, ArrowUp } from 'lucide-react';
import vendorsData from '@/data/vendors.json';
import type { Vendor } from '@/types';

interface VendorCardProps {
  vendorId: string;
  onTap: () => void;
  onHeartClick: () => void;
  isFavorite: boolean;
  onChatSend?: (text: string, vendorId: string) => void;
}

export function VendorCard({ vendorId, onTap, onHeartClick, isFavorite, onChatSend }: VendorCardProps) {
  const vendor = (vendorsData.vendors as Vendor[]).find(v => v.id === vendorId);
  const [input, setInput] = useState('');

  if (!vendor) return null;

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    onChatSend?.(input.trim(), vendorId);
    setInput('');
  }

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{ backgroundColor: '#1C1828', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
    >
      {/* Card body — tappable */}
      <div onClick={onTap} className="flex cursor-pointer" style={{ height: '112px' }}>
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

      {/* Chat input row */}
      <form
        onSubmit={handleSend}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '8px 10px',
          direction: 'rtl',
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`שאל על ${vendor.name}...`}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#F5F0E8',
            fontSize: '13px',
            direction: 'rtl',
            fontFamily: 'inherit',
          }}
        />
        <button
          type="submit"
          style={{
            width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
            backgroundColor: input.trim() ? '#E8A87C' : 'rgba(232,168,124,0.15)',
            border: 'none', cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background-color 0.15s',
          }}
        >
          <ArrowUp size={13} style={{ color: input.trim() ? '#1A1428' : 'rgba(232,168,124,0.4)' }} />
        </button>
      </form>
    </div>
  );
}
