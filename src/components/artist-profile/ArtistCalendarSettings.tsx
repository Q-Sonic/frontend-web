import { useState, useMemo, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiClock, FiSave, FiPlus } from 'react-icons/fi';
import { Button } from '../Button';
import { localDateKey } from '../../helpers/artistProfile';
import { doc, updateDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../config/firebase';

const WEEKDAYS_ES = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'] as const;

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isBeforeToday(date: Date): boolean {
  const today = startOfLocalDay(new Date());
  return startOfLocalDay(date) < today;
}

function buildMonthCells(year: number, month: number): { inMonth: boolean; date: Date }[] {
  const first = new Date(year, month, 1);
  const pad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { inMonth: boolean; date: Date }[] = [];
  const prevLast = new Date(year, month, 0).getDate();
  for (let i = pad - 1; i >= 0; i--) {
    const d = prevLast - i;
    cells.push({ inMonth: false, date: new Date(year, month - 1, d) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ inMonth: true, date: new Date(year, month, d) });
  }
  let next = 1;
  while (cells.length < 42) {
    cells.push({ inMonth: false, date: new Date(year, month + 1, next) });
    next += 1;
  }
  return cells;
}

function formatMonthYearLabel(year: number, month: number): string {
  const raw = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(
    new Date(year, month, 1)
  );
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

interface ArtistCalendarSettingsProps {
  artistId: string;
}

export function ArtistCalendarSettings({ artistId }: ArtistCalendarSettingsProps) {
  const now = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadBlockedDates() {
      if (!artistId) return;
      try {
        const artistRef = doc(db, 'artists', artistId);
        const snap = await getDoc(artistRef);
        if (snap.exists()) {
          setBlockedDates(snap.data().blockedDates || []);
        }
      } catch (err) {
        console.error('Error loading blocked dates:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBlockedDates();
  }, [artistId]);

  const cells = useMemo(() => buildMonthCells(viewYear, viewMonth), [viewYear, viewMonth]);
  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates]);

  const toggleDate = async (key: string) => {
    if (!artistId || saving) return;
    setSaving(true);
    const isBlocked = blockedSet.has(key);
    try {
      const artistRef = doc(db, 'artists', artistId);
      if (isBlocked) {
        await updateDoc(artistRef, {
          blockedDates: arrayRemove(key)
        });
        setBlockedDates(prev => prev.filter(d => d !== key));
      } else {
        await updateDoc(artistRef, {
          blockedDates: arrayUnion(key)
        });
        setBlockedDates(prev => [...prev, key]);
      }
    } catch (err) {
      console.error('Error toggling blocked date:', err);
    } finally {
      setSaving(false);
    }
  };

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-neutral-500">
        <FiCalendar className="animate-pulse mb-4" size={48} />
        <p>Cargando disponibilidad...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <header>
        <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
          <FiCalendar className="text-[#38BACC]" /> Gestión de Disponibilidad
        </h2>
        <p className="text-sm text-neutral-400">
          Seleccioná los días que no vas a estar disponible para recibir propuestas. Los días bloqueados no se mostrarán en tu perfil.
        </p>
      </header>

      <div className="rounded-3xl border border-white/10 bg-black/20 p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
           <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full bg-[#38BACC]/20 border border-[#38BACC]"></div>
              <span className="text-sm text-neutral-400">Día Bloqueado</span>
           </div>
           
           <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-[#111214] px-2 py-2">
            <button
              onClick={goPrevMonth}
              className="rounded-xl p-2.5 text-neutral-300 transition hover:bg-white/10 hover:text-[#38BACC]"
            >
              <FiChevronLeft size={20} />
            </button>
            <span className="min-w-[12rem] text-center text-base font-semibold text-white">
              {formatMonthYearLabel(viewYear, viewMonth)}
            </span>
            <button
              onClick={goNextMonth}
              className="rounded-xl p-2.5 text-neutral-300 transition hover:bg-white/10 hover:text-[#38BACC]"
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#111214]">
          <div className="grid grid-cols-7 gap-px bg-white/5">
            {WEEKDAYS_ES.map((d) => (
              <div
                key={d}
                className="bg-[#0b0c0e] py-3 text-center text-[10px] font-bold tracking-widest text-neutral-500 uppercase sm:text-xs"
              >
                {d}
              </div>
            ))}
            {cells.map((cell, idx) => {
              const key = localDateKey(cell.date);
              const past = isBeforeToday(cell.date);
              const isBlocked = blockedSet.has(key);
              const muted = !cell.inMonth;

              return (
                <button
                  key={`${key}-${idx}`}
                  disabled={past || saving}
                  onClick={() => toggleDate(key)}
                  className={`relative min-h-[64px] sm:min-h-[80px] p-2 text-sm font-medium transition-all group
                    ${past ? 'bg-[#0b0c0e]/50 text-neutral-700 cursor-not-allowed' : 'bg-[#0b0c0e] hover:bg-white/5'}
                    ${isBlocked && !past ? 'z-[1]' : ''}
                    ${muted && !past ? 'text-neutral-600' : 'text-neutral-300'}
                  `}
                >
                  <span className={`relative z-10 ${isBlocked && !past ? 'text-[#38BACC]' : ''}`}>
                    {cell.date.getDate()}
                  </span>
                  
                  {isBlocked && !past && (
                    <div className="absolute inset-1 rounded-xl bg-[#38BACC]/15 border border-[#38BACC]/30 flex items-center justify-center">
                       <FiClock className="text-[#38BACC]/50" size={14} />
                    </div>
                  )}
                  
                  {!past && !isBlocked && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <FiPlus className="text-neutral-500" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <Button variant="secondary" onClick={() => window.history.back()} className="rounded-2xl px-8">
           Volver
        </Button>
      </div>
    </div>
  );
}
