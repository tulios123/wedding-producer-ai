'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, ArrowUp, Heart } from 'lucide-react';
import vendorsData from '@/data/vendors.json';
import type { Slot, Vendor } from '@/types';

interface SlotVendorSheetProps {
  slot: Slot | null;
  isFavorite: boolean;
  onClose: () => void;
  onToggleFavorite: (vendorId: string) => void;
  onSend: (text: string) => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  idle:        { label: 'לא טופל',  color: '#6B6478', bg: 'rgba(107,100,120,0.12)' },
  collecting:  { label: 'אוספים',   color: '#B8A4D9', bg: 'rgba(184,164,217,0.12)' },
  negotiating: { label: 'במו"מ',    color: '#E8A87C', bg: 'rgba(232,168,124,0.12)' },
  hold:        { label: 'Hold',     color: '#D4A574', bg: 'rgba(212,180,150,0.12)' },
  signed:      { label: 'חתום',     color: '#8FBC8F', bg: 'rgba(143,188,143,0.12)' },
};

export function SlotVendorSheet({ slot, isFavorite, onClose, onToggleFavorite, onSend }: SlotVendorSheetProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const vendor = slot?.vendor
    ? (vendorsData.vendors as Vendor[]).find(v => v.name === slot.vendor) ?? null
    : null;

  const cfg = slot ? (STATUS_LABELS[slot.status] ?? STATUS_LABELS.idle) : STATUS_LABELS.idle;

  function handleSend() {
    if (!input.trim() || !slot) return;
    onSend(input.trim());
    setInput('');
  }

  return (
    <AnimatePresence>
      {slot && (
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
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col"
            style={{
              maxWidth: '430px',
              margin: '0 auto',
              backgroundColor: '#0F0A1A',
              maxHeight: '90vh',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Scrollable vendor details */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {vendor ? (
                <>
                  {/* Image header */}
                  <div className="relative w-full flex-shrink-0" style={{ height: '220px' }}>
                    <Image
                      src={vendor.images[0]}
                      alt={vendor.name}
                      fill
                      sizes="430px"
                      style={{ objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(15,10,26,0.85) 100%)',
                    }} />
                    <button
                      onClick={onClose}
                      className="absolute top-3 right-3 flex items-center justify-center rounded-full"
                      style={{ width: '32px', height: '32px', backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer' }}
                    >
                      <X size={16} style={{ color: 'white' }} />
                    </button>
                    <button
                      onClick={() => onToggleFavorite(vendor.id)}
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

                  {/* Details */}
                  <div style={{ padding: '20px 16px 8px', direction: 'rtl' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        backgroundColor: cfg.bg,
                        color: cfg.color,
                        fontSize: '11px', padding: '2px 10px',
                        borderRadius: '20px', fontWeight: 600,
                      }}>
                        {slot.label} · {cfg.label}
                      </span>
                      <span style={{ color: '#7A7280', fontSize: '12px' }}>{vendor.region}</span>
                    </div>

                    <h2 style={{ color: '#F5F0E8', fontSize: '22px', fontWeight: 700, marginBottom: '8px', lineHeight: 1.2 }}>
                      {vendor.name}
                    </h2>

                    <p style={{ color: '#B8B0A8', fontSize: '14px', lineHeight: 1.7, marginBottom: '16px' }}>
                      {vendor.description}
                    </p>

                    {/* Price */}
                    <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'rgba(232,168,124,0.08)', borderRadius: '12px' }}>
                      <p style={{ color: '#7A7280', fontSize: '11px', marginBottom: '4px' }}>טווח מחיר</p>
                      <p style={{ color: '#E8A87C', fontSize: '18px', fontWeight: 700 }}>
                        ₪{vendor.priceRange.min.toLocaleString()} – ₪{vendor.priceRange.max.toLocaleString()}
                      </p>
                      {slot.amount && (
                        <p style={{ color: '#8FBC8F', fontSize: '13px', marginTop: '4px', fontWeight: 600 }}>
                          סוגר ב-₪{slot.amount.toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Bullets */}
                    <div style={{ marginBottom: '8px' }}>
                      {vendor.bullets.map((b, i) => (
                        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ color: '#E8A87C', flexShrink: 0 }}>✓</span>
                          <span style={{ color: '#B8B0A8', fontSize: '14px', lineHeight: 1.5 }}>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* No vendor in DB — show slot status card */
                <div style={{ padding: '24px 16px 8px', direction: 'rtl' }}>
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center rounded-full"
                    style={{ width: '32px', height: '32px', backgroundColor: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', marginBottom: '20px' }}
                  >
                    <X size={16} style={{ color: '#F5F0E8' }} />
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ color: '#E8A87C', fontSize: '11px', fontWeight: 600 }}>{slot.label}</span>
                    <span style={{ backgroundColor: cfg.bg, color: cfg.color, fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>
                      {cfg.label}
                    </span>
                  </div>

                  <h2 style={{ color: '#F5F0E8', fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>
                    {slot.vendor ?? 'עדיין לא נבחר ספק'}
                  </h2>

                  {slot.estimate && !slot.amount && (
                    <p style={{ color: '#7A7280', fontSize: '14px' }}>
                      הערכה: ₪{slot.estimate.min.toLocaleString()} – ₪{slot.estimate.max.toLocaleString()}
                    </p>
                  )}
                  {slot.amount && (
                    <p style={{ color: '#8FBC8F', fontSize: '15px', fontWeight: 600, marginTop: '8px' }}>
                      סוגר: ₪{slot.amount.toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Sticky chat input */}
            <div style={{
              flexShrink: 0,
              padding: '10px 12px 28px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              backgroundColor: '#0F0A1A',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#1A1428',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '999px',
                padding: '8px 8px 8px 16px',
              }}>
                <input
                  ref={inputRef}
                  autoFocus
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#F5F0E8',
                    fontSize: '14px',
                    direction: 'rtl',
                    fontFamily: 'inherit',
                  }}
                  placeholder={`שאל על ${slot.label}${vendor ? ` — ${vendor.name}` : ''}...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  onClick={handleSend}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: '#E8A87C',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ArrowUp size={15} style={{ color: '#1A1428' }} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
