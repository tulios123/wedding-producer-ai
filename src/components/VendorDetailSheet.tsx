'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, Heart, ArrowUp } from 'lucide-react';
import vendorsData from '@/data/vendors.json';
import type { Vendor } from '@/types';

interface VendorDetailSheetProps {
  vendorId: string | null;
  isFavorite: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
  onAskAgent: () => void;
  onChatSend?: (text: string, vendorId: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  venue: 'מקום',
  catering: 'קייטרינג',
  photography: 'צילום',
};

export function VendorDetailSheet({ vendorId, isFavorite, onClose, onToggleFavorite, onChatSend }: VendorDetailSheetProps) {
  const vendor = vendorId ? (vendorsData.vendors as Vendor[]).find(v => v.id === vendorId) ?? null : null;
  const [input, setInput] = useState('');

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !vendorId) return;
    onChatSend?.(input.trim(), vendorId);
    setInput('');
    onClose();
  }

  return (
    <AnimatePresence>
      {vendor && (
        <motion.div
          className="fixed inset-0 z-[60]"
          style={{
            maxWidth: '430px',
            margin: '0 auto',
            backgroundColor: '#0F0A1A',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          drag="y"
          dragConstraints={{ top: 0 }}
          dragElastic={{ top: 0, bottom: 0.3 }}
          onDragEnd={(_, info) => { if (info.offset.y > 80) onClose(); }}
        >
          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px', flexShrink: 0 }}>
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.18)' }} />
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* Image */}
            <div className="relative w-full" style={{ height: '260px', flexShrink: 0 }}>
              <Image
                src={vendor.images[0]}
                alt={vendor.name}
                fill
                sizes="430px"
                style={{ objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 40%, rgba(15,10,26,0.9) 100%)',
                }}
              />
              {/* X button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 flex items-center justify-center rounded-full"
                style={{ width: '32px', height: '32px', backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer' }}
              >
                <X size={16} style={{ color: 'white' }} />
              </button>
              {/* Heart button */}
              <button
                onClick={onToggleFavorite}
                className="absolute top-3 left-3 flex items-center justify-center rounded-full"
                style={{ width: '32px', height: '32px', backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer' }}
              >
                <Heart
                  size={16}
                  fill={isFavorite ? 'currentColor' : 'none'}
                  strokeWidth={1.5}
                  style={{ color: isFavorite ? '#E8A87C' : 'white' }}
                />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '20px 16px 32px', direction: 'rtl' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: '6px' }}>
                <span
                  className="rounded-full"
                  style={{ backgroundColor: 'rgba(232,168,124,0.15)', color: '#E8A87C', fontSize: '11px', padding: '2px 10px', fontWeight: 600 }}
                >
                  {CATEGORY_LABELS[vendor.category] ?? vendor.category}
                </span>
                <span style={{ color: '#7A7280', fontSize: '12px' }}>{vendor.region}</span>
              </div>

              <h2 style={{ color: '#F5F0E8', fontSize: '24px', fontWeight: '700', marginBottom: '8px', lineHeight: 1.2 }}>
                {vendor.name}
              </h2>

              <p style={{ color: '#B8B0A8', fontSize: '14px', lineHeight: 1.7, marginBottom: '20px' }}>
                {vendor.description}
              </p>

              {/* Price */}
              <div style={{ marginBottom: '20px', padding: '14px', backgroundColor: 'rgba(232,168,124,0.08)', borderRadius: '14px' }}>
                <p style={{ color: '#7A7280', fontSize: '11px', marginBottom: '4px' }}>טווח מחיר</p>
                <p style={{ color: '#E8A87C', fontSize: '20px', fontWeight: '700' }}>
                  ₪{vendor.priceRange.min.toLocaleString()} – ₪{vendor.priceRange.max.toLocaleString()}
                </p>
              </div>

              {/* Bullets */}
              <div>
                {vendor.bullets.map((b, i) => (
                  <div key={i} className="flex gap-2" style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#E8A87C', flexShrink: 0 }}>✓</span>
                    <span style={{ color: '#B8B0A8', fontSize: '14px', lineHeight: 1.6 }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat input bar */}
          <form
            onSubmit={handleSend}
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px 28px',
              borderTop: '1px solid rgba(255,255,255,0.07)',
              backgroundColor: '#0F0A1A',
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={vendor ? `שאל על ${vendor.name}...` : 'שאל שאלה...'}
              style={{
                flex: 1,
                backgroundColor: '#1A1428',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '22px',
                padding: '10px 16px',
                color: '#F5F0E8',
                fontSize: '14px',
                direction: 'rtl',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                backgroundColor: input.trim() ? '#E8A87C' : 'rgba(232,168,124,0.15)',
                border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background-color 0.15s',
              }}
            >
              <ArrowUp size={16} style={{ color: input.trim() ? '#1A1428' : 'rgba(232,168,124,0.4)' }} />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
