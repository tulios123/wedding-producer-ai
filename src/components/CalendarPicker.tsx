'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface CalendarPickerProps {
  onSelect: (value: string) => void;
}

const HE_MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const HE_DAYS   = ['א','ב','ג','ד','ה','ו','ש'];

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function startDay(y: number, m: number)    { return new Date(y, m, 1).getDay(); }
function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function heLabel(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ב${HE_MONTHS[m - 1]} ${y}`;
}

export function CalendarPicker({ onSelect }: CalendarPickerProps) {
  const now   = new Date();
  const [mode, setMode]       = useState<'single' | 'range'>('single');
  const [year, setYear]       = useState(now.getFullYear());
  const [month, setMonth]     = useState(now.getMonth());
  const [single, setSingle]   = useState<string | null>(null);
  const [rangeA, setRangeA]   = useState<string | null>(null);
  const [rangeB, setRangeB]   = useState<string | null>(null);

  function switchMode(m: 'single' | 'range') {
    setMode(m);
    setSingle(null); setRangeA(null); setRangeB(null);
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function handleDay(d: number) {
    const iso = isoDate(year, month, d);
    if (mode === 'single') {
      setSingle(iso);
    } else {
      if (!rangeA || (rangeA && rangeB)) {
        setRangeA(iso); setRangeB(null);
      } else {
        if (iso < rangeA) { setRangeB(rangeA); setRangeA(iso); }
        else              { setRangeB(iso); }
      }
    }
  }

  type DayState = 'selected' | 'range-start' | 'range-end' | 'in-range' | 'none';
  function dayState(d: number): DayState {
    const iso = isoDate(year, month, d);
    if (mode === 'single') return iso === single ? 'selected' : 'none';
    if (iso === rangeA) return 'range-start';
    if (iso === rangeB) return 'range-end';
    if (rangeA && rangeB && iso > rangeA && iso < rangeB) return 'in-range';
    return 'none';
  }

  function handleConfirm() {
    if (mode === 'single' && single) {
      onSelect(heLabel(single));
    } else if (mode === 'range' && rangeA && rangeB) {
      onSelect(`${heLabel(rangeA)} – ${heLabel(rangeB)}`);
    } else if (mode === 'range' && rangeA) {
      onSelect(heLabel(rangeA));
    }
  }

  const canConfirm = mode === 'single' ? !!single : !!rangeA;
  const confirmLabel = mode === 'range' && rangeA && !rangeB
    ? 'בחר תאריך סיום'
    : 'אישור';

  const offset = startDay(year, month);
  const total  = daysInMonth(year, month);
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // range hint text
  const rangeHint = mode === 'range'
    ? rangeA && rangeB
      ? `${heLabel(rangeA)} – ${heLabel(rangeB)}`
      : rangeA
        ? `מ-${heLabel(rangeA)} · בחר תאריך סיום`
        : 'בחר תאריך התחלה'
    : null;

  return (
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '16px', direction: 'rtl', width: '100%' }}>

      {/* Mode toggle */}
      <div style={{
        display: 'flex', backgroundColor: 'rgba(180,120,140,0.08)',
        borderRadius: '12px', padding: '3px', marginBottom: '16px',
      }}>
        {(['single', 'range'] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            style={{
              flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer',
              borderRadius: '10px', fontSize: '13px', fontWeight: '600',
              transition: 'all 0.2s',
              backgroundColor: mode === m ? '#C97B8F' : 'transparent',
              color: mode === m ? '#FFFFFF' : '#A89098',
            }}
          >
            {m === 'single' ? 'תאריך מדויק' : 'טווח תאריכים'}
          </button>
        ))}
      </div>

      {/* Range hint */}
      {mode === 'range' && (
        <div style={{ textAlign: 'center', color: 'rgba(201,123,143,0.9)', fontSize: '12px', marginBottom: '12px', minHeight: '16px' }}>
          {rangeHint}
        </div>
      )}

      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C97B8F', padding: '4px 8px' }}>
          <ChevronRight size={18} />
        </button>
        <span style={{ color: '#1A0F14', fontSize: '15px', fontWeight: '600' }}>
          {HE_MONTHS[month]} {year}
        </span>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C97B8F', padding: '4px 8px' }}>
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
        {HE_DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', color: 'rgba(26,15,20,0.25)', fontSize: '11px', fontWeight: '600', paddingBottom: '6px' }}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px' }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const st = dayState(d);
          const isEndpoint = st === 'selected' || st === 'range-start' || st === 'range-end';
          const isInRange  = st === 'in-range';
          return (
            <button
              key={i}
              onClick={() => handleDay(d)}
              style={{
                height: '38px', border: 'none', cursor: 'pointer',
                borderRadius: isInRange ? '0' : '50%',
                backgroundColor: isEndpoint ? '#C97B8F' : isInRange ? 'rgba(201,123,143,0.12)' : 'transparent',
                color: isEndpoint ? '#FFFFFF' : isInRange ? '#C97B8F' : 'rgba(26,15,20,0.75)',
                fontSize: '14px', fontWeight: isEndpoint ? '700' : '400',
              }}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          style={{
            width: '100%', padding: '13px', border: 'none', borderRadius: '14px',
            backgroundColor: canConfirm ? '#C97B8F' : 'rgba(201,123,143,0.15)',
            color: canConfirm ? '#FFFFFF' : 'rgba(201,123,143,0.45)',
            fontSize: '15px', fontWeight: '700',
            cursor: canConfirm ? 'pointer' : 'default', transition: 'all 0.2s',
          }}
        >
          {confirmLabel}
        </button>
        <button
          onClick={() => onSelect('עדיין לא בטוח')}
          style={{
            width: '100%', padding: '12px', border: 'none', borderRadius: '14px',
            backgroundColor: 'transparent',
            color: '#A89098',
            fontSize: '14px', fontWeight: '500', cursor: 'pointer',
          }}
        >
          עדיין לא בטוח/ה
        </button>
      </div>
    </div>
  );
}
