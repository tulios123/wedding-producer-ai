'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface CalendarPickerProps {
  mode: 'single' | 'range';
  onSelect: (value: string) => void;
}

const HE_MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const HE_DAYS = ['א','ב','ג','ד','ה','ו','ש'];

function startOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function heDate(y: number, m: number, d: number) {
  return `${d} ב${HE_MONTHS[m]} ${y}`;
}

export function CalendarPicker({ mode, onSelect }: CalendarPickerProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string | null>(null);        // single
  const [rangeStart, setRangeStart] = useState<string | null>(null);   // range start
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);       // range end

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
      setSelected(iso);
    } else {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(iso);
        setRangeEnd(null);
      } else {
        if (iso < rangeStart) {
          setRangeEnd(rangeStart);
          setRangeStart(iso);
        } else {
          setRangeEnd(iso);
        }
      }
    }
  }

  function handleConfirm() {
    if (mode === 'single' && selected) {
      onSelect(selected);
    } else if (mode === 'range' && rangeStart && rangeEnd) {
      const [sy, sm, sd] = rangeStart.split('-').map(Number);
      const [ey, em, ed] = rangeEnd.split('-').map(Number);
      const startLabel = `${sd} ב${HE_MONTHS[sm - 1]}`;
      const endLabel = `${ed} ב${HE_MONTHS[em - 1]} ${ey}`;
      onSelect(`${startLabel} – ${endLabel}`);
    } else if (mode === 'range' && rangeStart) {
      const [sy, sm, sd] = rangeStart.split('-').map(Number);
      onSelect(`${sd} ב${HE_MONTHS[sm - 1]} ${sy}`);
    }
  }

  function dayState(d: number): 'selected' | 'range-start' | 'range-end' | 'in-range' | 'none' {
    const iso = isoDate(year, month, d);
    if (mode === 'single') return iso === selected ? 'selected' : 'none';
    if (iso === rangeStart) return 'range-start';
    if (iso === rangeEnd) return 'range-end';
    if (rangeStart && rangeEnd && iso > rangeStart && iso < rangeEnd) return 'in-range';
    return 'none';
  }

  const offset = startOfMonth(year, month);
  const total = daysInMonth(year, month);
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const canConfirm = mode === 'single' ? !!selected : !!(rangeStart && rangeEnd);

  return (
    <div style={{ backgroundColor: '#1C1828', borderRadius: '20px', padding: '16px', marginTop: '8px', direction: 'rtl' }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#E8A87C' }}>
          <ChevronRight size={18} />
        </button>
        <span style={{ color: '#F5F0E8', fontSize: '15px', fontWeight: '600' }}>
          {HE_MONTHS[month]} {year}
        </span>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#E8A87C' }}>
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '6px' }}>
        {HE_DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', color: 'rgba(245,240,232,0.3)', fontSize: '11px', fontWeight: '600', paddingBottom: '6px' }}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const state = dayState(d);
          const isHighlighted = state !== 'none';
          const isEndpoint = state === 'selected' || state === 'range-start' || state === 'range-end';
          return (
            <button
              key={i}
              onClick={() => handleDay(d)}
              style={{
                height: '36px',
                border: 'none',
                cursor: 'pointer',
                borderRadius: state === 'in-range' ? '0' : '50%',
                backgroundColor: isEndpoint
                  ? '#E8A87C'
                  : state === 'in-range'
                    ? 'rgba(232,168,124,0.15)'
                    : 'transparent',
                color: isEndpoint ? '#1A1428' : state === 'in-range' ? '#E8A87C' : 'rgba(245,240,232,0.85)',
                fontSize: '14px',
                fontWeight: isEndpoint ? '700' : '400',
                transition: 'background-color 0.15s',
              }}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* Confirm */}
      <button
        onClick={handleConfirm}
        disabled={!canConfirm}
        style={{
          width: '100%',
          marginTop: '14px',
          padding: '12px',
          backgroundColor: canConfirm ? '#E8A87C' : 'rgba(232,168,124,0.2)',
          border: 'none',
          borderRadius: '14px',
          color: canConfirm ? '#1A1428' : 'rgba(232,168,124,0.5)',
          fontSize: '15px',
          fontWeight: '700',
          cursor: canConfirm ? 'pointer' : 'default',
          transition: 'all 0.2s',
        }}
      >
        {mode === 'range' && rangeStart && !rangeEnd ? 'בחר תאריך סיום' : 'אישור'}
      </button>
    </div>
  );
}
