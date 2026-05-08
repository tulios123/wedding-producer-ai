'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, Heart } from 'lucide-react';
import vendorsData from '@/data/vendors.json';
import type { Vendor } from '@/types';

interface VendorDetailSheetProps {
  vendorId: string | null;
  isFavorite: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
  onAskAgent: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  venue: 'מקום',
  catering: 'קייטרינג',
  photography: 'צילום',
};

export function VendorDetailSheet({ vendorId, isFavorite, onClose, onToggleFavorite, onAskAgent }: VendorDetailSheetProps) {
  const vendor = vendorId ? (vendorsData.vendors as Vendor[]).find(v => v.id === vendorId) ?? null : null;

  return (
    <AnimatePresence>
      {vendor && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
            style={{
              maxWidth: '430px',
              margin: '0 auto',
              backgroundColor: '#1A1428',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="overflow-y-auto">
              {/* Image */}
              <div className="relative w-full flex-shrink-0" style={{ height: '220px' }}>
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
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(15,10,26,0.8) 100%)',
                  }}
                />
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 flex items-center justify-center rounded-full"
                  style={{ width: '32px', height: '32px', backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer' }}
                >
                  <X size={16} style={{ color: 'white' }} />
                </button>
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
              <div style={{ padding: '20px 16px', direction: 'rtl' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: '6px' }}>
                  <span
                    className="rounded-full"
                    style={{ backgroundColor: 'rgba(232,168,124,0.15)', color: '#E8A87C', fontSize: '11px', padding: '2px 10px', fontWeight: 600 }}
                  >
                    {CATEGORY_LABELS[vendor.category] ?? vendor.category}
                  </span>
                  <span style={{ color: '#7A7280', fontSize: '12px' }}>{vendor.region}</span>
                </div>

                <h2 style={{ color: '#F5F0E8', fontSize: '22px', fontWeight: '700', marginBottom: '8px', lineHeight: 1.2 }}>
                  {vendor.name}
                </h2>

                <p style={{ color: '#B8B0A8', fontSize: '14px', lineHeight: 1.7, marginBottom: '16px' }}>
                  {vendor.description}
                </p>

                {/* Price */}
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'rgba(232,168,124,0.08)', borderRadius: '12px' }}>
                  <p style={{ color: '#7A7280', fontSize: '11px', marginBottom: '4px' }}>טווח מחיר</p>
                  <p style={{ color: '#E8A87C', fontSize: '18px', fontWeight: '700' }}>
                    ₪{vendor.priceRange.min.toLocaleString()} – ₪{vendor.priceRange.max.toLocaleString()}
                  </p>
                </div>

                {/* Bullets */}
                <div style={{ marginBottom: '24px' }}>
                  {vendor.bullets.map((b, i) => (
                    <div key={i} className="flex gap-2" style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#E8A87C', flexShrink: 0 }}>✓</span>
                      <span style={{ color: '#B8B0A8', fontSize: '14px', lineHeight: 1.5 }}>{b}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={onAskAgent}
                  style={{
                    width: '100%',
                    padding: '15px',
                    backgroundColor: '#E8A87C',
                    border: 'none',
                    borderRadius: '14px',
                    color: '#1A1428',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    marginBottom: '8px',
                  }}
                >
                  שאל את הסוכן על {vendor.name}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
