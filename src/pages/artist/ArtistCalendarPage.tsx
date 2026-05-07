import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ApiResponse } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { isBackendRoleArtista } from '../../helpers/role';
import { withMinimumDelay } from '../../helpers/withMinimumDelay';
import { api } from '../../api';
import { Button, Skeleton, UserMenu } from '../../components';
import { 
  FiArrowLeft, FiCalendar, FiChevronLeft, FiChevronRight, FiLock, 
  FiSearch, FiClock, FiMapPin, FiPhone, FiDownload, FiX, FiCheckCircle, FiInfo, FiEdit3 
} from 'react-icons/fi';
import { getArtistProfile, toggleArtistBlockedDate } from '../../api/artistProfileService';
import { artistAcceptContract, artistRejectContract, dispatchContractsApiRefresh } from '../../api/contractService';
import { ClientContractSigningModal } from '../../components/client/ClientContractSigningModal';

/* ── Types ── */
type CalendarContractEvent = {
  id: string;
  status: string;
  eventDetails?: {
    name?: string;
    date?: unknown;
    location?: string;
    description?: string;
  };
};

type ExtendedEventDetail = {
  id: string;
  status?: string;
  duration?: string;
  serviceName?: string;
  serviceDescription?: string;
  financials?: {
    totalAmount?: number;
    paymentStatus?: string;
  };
  clientContact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  eventDetails?: {
    name?: string;
    date?: unknown;
    location?: string;
    description?: string;
  };
  riderDownloadUrl?: string;
  contractDownloadUrl?: string;
};

/* ── Helpers ── */
function parseFirestoreTimestamp(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const seconds = obj.seconds ?? obj._seconds;
    const nanoseconds = obj.nanoseconds ?? obj._nanoseconds;
    if (typeof seconds === 'number') {
      const ms = seconds * 1000 + (typeof nanoseconds === 'number' ? nanoseconds / 1e6 : 0);
      const d = new Date(ms);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }
  return null;
}

function startOfWeekMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, days: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date;
}

function formatMonthYear(d: Date): string {
  const label = d.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDateShort(d: Date): string {
  const day = d.getDate();
  const month = d.toLocaleString('es-ES', { month: 'short' });
  return `${day} ${month}`;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function getDayIndexMonday(date: Date, weekStartMonday: Date): number {
  const start = new Date(weekStartMonday.getFullYear(), weekStartMonday.getMonth(), weekStartMonday.getDate()).getTime();
  const current = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.floor((current - start) / (24 * 60 * 60 * 1000));
  return diffDays;
}

export function ArtistCalendarPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isArtista = isBackendRoleArtista(user?.role);

  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [events, setEvents] = useState<CalendarContractEvent[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isEventLoading, setIsEventLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ExtendedEventDetail | null>(null);
  
  const [artistSigningOpen, setArtistSigningOpen] = useState(false);
  const [artistSigningLoading, setArtistSigningLoading] = useState(false);
  const [artistActionError, setArtistActionError] = useState('');

  const range = useMemo(() => {
    const start = new Date(weekStart);
    const end = addDays(weekStart, 7);
    return { start, end };
  }, [weekStart]);

  const fetchCalendarData = async () => {
    if (!user?.uid || !isArtista) return;
    setIsLoading(true);
    try {
      const startIso = range.start.toISOString();
      const endIso = range.end.toISOString();
      const [res, profile] = await Promise.all([
        api<ApiResponse<CalendarContractEvent[]>>(`events/calendar?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`),
        getArtistProfile()
      ]);
      setEvents(res.data ?? []);
      setBlockedDates(profile.blockedDates || []);
    } catch (err) {
      setError('Error al cargar el calendario');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [user?.uid, isArtista, range.start, range.end]);

  const handleDayToggle = async (day: Date) => {
    const key = day.toISOString().split('T')[0];
    try {
      const next = await toggleArtistBlockedDate(key);
      setBlockedDates(next);
    } catch (err) {
      console.error(err);
    }
  };

  async function openEvent(contractId: string) {
    setSelectedEventId(contractId);
    setIsEventLoading(true);
    try {
      const detailRes = await api<ApiResponse<ExtendedEventDetail>>(`events/${contractId}`);
      setSelectedEvent(detailRes.data ?? null);
    } catch {
      setSelectedEvent(null);
    } finally {
      setIsEventLoading(false);
    }
  }

  const weekDates = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);

  const eventsByDay = useMemo(() => {
    const map: Record<number, (CalendarContractEvent & { left: string; width: string; zIndex: number })[]> = {};
    for (let i = 0; i < 7; i++) map[i] = [];

    for (let i = 0; i < 7; i++) {
      const dayEvents = events.filter(ev => {
        const d = parseFirestoreTimestamp(ev.eventDetails?.date);
        if (!d) return false;
        const idx = getDayIndexMonday(d, weekStart);
        return idx === i;
      }).sort((a, b) => {
        const da = parseFirestoreTimestamp(a.eventDetails?.date)?.getTime() || 0;
        const db = parseFirestoreTimestamp(b.eventDetails?.date)?.getTime() || 0;
        return da - db;
      });

      // Simple overlap detection algorithm
      const columns: CalendarContractEvent[][] = [];
      
      dayEvents.forEach(ev => {
        let placed = false;
        const evStart = parseFirestoreTimestamp(ev.eventDetails?.date)?.getTime() || 0;
        
        for (let colIdx = 0; colIdx < columns.length; colIdx++) {
          const lastInCol = columns[colIdx][columns[colIdx].length - 1];
          const lastEnd = (parseFirestoreTimestamp(lastInCol.eventDetails?.date)?.getTime() || 0) + (90 * 60 * 1000);
          
          if (evStart >= lastEnd) {
            columns[colIdx].push(ev);
            placed = true;
            break;
          }
        }
        
        if (!placed) {
          columns.push([ev]);
        }
      });

      const totalCols = columns.length;
      columns.forEach((col, colIdx) => {
        col.forEach(ev => {
          map[i].push({
            ...ev,
            left: `${(colIdx / totalCols) * 100}%`,
            width: `${(1 / totalCols) * 100}%`,
            zIndex: 10 + colIdx
          });
        });
      });
    }

    return map;
  }, [events, weekStart]);

  const rowHeight = 60;
  const slotCount = 24;
  const dayHeaderHeight = 64;

  if (!user || !isArtista) return null;

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-white overflow-hidden font-sans">
      {/* ── Sidebar (Left) ── */}
      <aside className="w-72 border-r border-white/5 flex flex-col bg-[#0A0A0A]">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <FiCalendar className="text-accent" />
            </div>
            <span className="font-bold text-lg tracking-tight">Q-Music</span>
          </div>

          {/* Mini Calendar Mockup */}
          <div className="mb-10">
             <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold">{formatMonthYear(weekStart).split(' ')[0]}</span>
                <div className="flex gap-1">
                   <button className="p-1 hover:bg-white/5 rounded"><FiChevronLeft size={14}/></button>
                   <button className="p-1 hover:bg-white/5 rounded"><FiChevronRight size={14}/></button>
                </div>
             </div>
             <div className="grid grid-cols-7 gap-y-2 text-center text-[10px] text-white/30 font-medium">
                {['S','M','T','W','T','F','S'].map((d,i)=><div key={i}>{d}</div>)}
                {Array.from({length: 31}).map((_,i)=>(
                  <div key={i} className={`py-1 rounded-md text-[11px] ${i+1 === new Date().getDate() ? 'bg-accent text-black font-bold' : 'text-white/60'}`}>
                    {i+1}
                  </div>
                ))}
             </div>
          </div>

          <nav className="space-y-6">
            <div>
               <h4 className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-4">Calendarios</h4>
               <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <div className="w-3 h-3 rounded-full bg-accent" />
                    <span>Mis Eventos</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/40">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span>Cumpleaños</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/40">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span>Feriados</span>
                  </div>
               </div>
            </div>
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-white/5">
           <button className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
              <span className="text-xl">+</span>
              <span>Añadir cuenta</span>
           </button>
        </div>
      </aside>

      {/* ── Main Content (Center) ── */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A]">
        {/* Header */}
        <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between bg-[#0A0A0A]">
           <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
              title="Volver"
            >
              <FiArrowLeft className="text-white/60 group-hover:text-white transition-colors" size={20} />
            </button>
            <h1 className="text-xl font-bold tracking-tighter">
              {formatMonthYear(weekStart)}
            </h1>
              <div className="flex items-center bg-white/5 rounded-lg p-0.5">
                 <button className="px-3 py-1.5 text-xs font-medium rounded-md hover:bg-white/5">Día</button>
                 <button className="px-3 py-1.5 text-xs font-medium rounded-md bg-white/10 shadow-sm">Semana</button>
                 <button className="px-3 py-1.5 text-xs font-medium rounded-md hover:bg-white/5">Mes</button>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="relative">
                 <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                 <input 
                    type="text" 
                    placeholder="Buscar evento..." 
                    className="bg-white/5 border border-white/5 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent/50 w-64"
                 />
              </div>
              <div className="flex items-center gap-2 border-l border-white/5 pl-4">
                 <button className="p-2 hover:bg-white/5 rounded-lg" onClick={() => setWeekStart(w => addDays(w, -7))}><FiChevronLeft/></button>
                 <button className="px-3 py-1.5 text-xs font-bold hover:bg-white/5 rounded-lg" onClick={() => setWeekStart(startOfWeekMonday(new Date()))}>Hoy</button>
                 <button className="p-2 hover:bg-white/5 rounded-lg" onClick={() => setWeekStart(w => addDays(w, 7))}><FiChevronRight/></button>
              </div>
              <UserMenu />
           </div>
        </header>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto scrollbar-hide relative bg-[#0A0A0A]">
           <div className="flex min-w-[1000px] h-full">
              {/* Hours Labels */}
              <div className="w-16 shrink-0 border-r border-white/5 flex flex-col pt-[64px]">
                 {Array.from({length: 24}).map((_, i) => (
                    <div key={i} className="h-[60px] text-[10px] text-white/20 text-center pt-1 font-medium">
                       {i === 0 ? '' : `${i}:00`}
                    </div>
                 ))}
              </div>

              {/* Day Columns */}
              <div className="flex-1 flex">
                 {weekDates.map((day, idx) => {
                    const isToday = day.toDateString() === new Date().toDateString();
                    const dayEvents = eventsByDay[idx] || [];
                    const dateKey = day.toISOString().split('T')[0];
                    const isBlocked = blockedDates.includes(dateKey);

                    return (
                       <div key={idx} className={`flex-1 border-r border-white/5 last:border-r-0 flex flex-col relative ${isBlocked ? 'bg-red-500/[0.02]' : ''}`}>
                          {/* Header Day */}
                          <div className={`h-16 border-b border-white/5 flex flex-col items-center justify-center sticky top-0 bg-[#0A0A0A] z-20 ${isToday ? 'text-accent' : ''}`}>
                             <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">
                                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][day.getDay()]}
                             </span>
                             <span className={`text-lg font-bold mt-0.5 ${isToday ? 'w-8 h-8 flex items-center justify-center bg-accent text-black rounded-full' : ''}`}>
                                {day.getDate()}
                             </span>
                          </div>

                          {/* Grid Lines */}
                          <div className="absolute inset-0 top-16 pointer-events-none">
                             {Array.from({length: 24}).map((_, i) => (
                                <div key={i} className="h-[60px] border-b border-white/[0.03]" />
                             ))}
                          </div>

                          {/* Events */}
                          <div className="absolute inset-0 top-16">
                             {dayEvents.map(ev => {
                                const d = parseFirestoreTimestamp(ev.eventDetails?.date);
                                if (!d) return null;
                                const startMins = d.getHours() * 60 + d.getMinutes();
                                const top = (startMins / 60) * rowHeight;
                                // Use 90 mins as fallback but we should have real duration now
                                const height = 1.5 * rowHeight; 
                                
                                const statusColors: Record<string, string> = {
                                  'accepted': 'bg-accent/20 border-accent/40 text-accent hover:bg-accent hover:text-white',
                                  'pending': 'bg-amber-500/20 border-amber-500/40 text-amber-500 hover:bg-amber-500 hover:text-white',
                                  'pending_artist_signature': 'bg-purple-500/20 border-purple-500/40 text-purple-500 hover:bg-purple-500 hover:text-white',
                                };
                                const colorClass = statusColors[ev.status] || 'bg-blue-500/20 border-blue-500/40 text-blue-500 hover:bg-blue-500 hover:text-white';

                                 return (
                                  <button
                                     key={ev.id}
                                     onClick={() => openEvent(ev.id)}
                                     className={`absolute rounded-xl border p-2.5 text-left transition-all duration-300 hover:z-[100] hover:scale-[1.05] hover:!w-[250px] hover:shadow-accent/20 active:scale-95 group shadow-lg overflow-hidden ${colorClass}`}
                                     style={{ 
                                       top, 
                                       height, 
                                       left: `calc(${ev.left} + 2px)`, 
                                       width: `calc(${ev.width} - 4px)`,
                                       minWidth: "40px",
                                       zIndex: ev.zIndex
                                     }}
                                  >
                                     <div className="text-[11px] font-extrabold truncate leading-tight group-hover:whitespace-normal group-hover:overflow-visible group-hover:text-sm transition-all duration-300">
                                       {ev.eventDetails?.name || "Show"}
                                     </div>
                                     <div className="text-[9px] font-medium opacity-80 mt-1 flex items-center gap-1.5 bg-black/10 w-fit px-1.5 py-0.5 rounded-full shrink-0">
                                        <FiClock size={9} /> {formatTime(d)}
                                     </div>
                                  </button>
                                );
                             })}
                          </div>

                          {/* Blocked Day UI */}
                          {isBlocked && (
                             <div className="absolute inset-0 top-16 flex items-center justify-center pointer-events-none opacity-10">
                                <span className="rotate-[-45deg] font-black text-2xl tracking-tighter">BLOQUEADO</span>
                             </div>
                          )}
                       </div>
                    );
                 })}
              </div>
           </div>
        </div>
      </main>

      {/* ── Sidebar Right (Shortcuts) ── */}
      <aside className="w-80 border-l border-white/5 p-6 bg-[#0A0A0A] hidden xl:flex flex-col">
         <h4 className="text-sm font-bold mb-6">Useful shortcuts</h4>
         <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-white/50 group hover:text-white cursor-pointer transition-colors">
               <span>Command menu</span>
               <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] border border-white/10 group-hover:bg-white/10">Ctrl K</span>
            </div>
            <div className="flex items-center justify-between text-sm text-white/50 group hover:text-white cursor-pointer transition-colors">
               <span>Cron menu</span>
               <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] border border-white/10 group-hover:bg-white/10">`</span>
            </div>
            <div className="flex items-center justify-between text-sm text-white/50 group hover:text-white cursor-pointer transition-colors">
               <span>Go to date</span>
               <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] border border-white/10 group-hover:bg-white/10">.</span>
            </div>
         </div>

         <div className="mt-10 p-4 rounded-xl bg-accent/5 border border-accent/10">
            <div className="flex items-center gap-2 text-accent mb-2">
               <FiInfo size={16} />
               <span className="text-xs font-bold uppercase tracking-wider">Tip de hoy</span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
               Puedes bloquear días enteros haciendo click en el candado de cada columna. Así los clientes no podrán reservarte.
            </p>
         </div>
      </aside>

      {/* ── Event Modal ── */}
      {selectedEventId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#121212] shadow-2xl overflow-hidden flex flex-col">
            {/* Header with Background Image */}
            <div className="h-48 relative bg-accent/10 flex items-end p-8">
               <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent z-10" />
               <img 
                  src="https://images.unsplash.com/photo-1514525253361-bee8718a300a?q=80&w=1000&auto=format&fit=crop" 
                  className="absolute inset-0 w-full h-full object-cover opacity-40"
                  alt="Event cover"
               />
               <div className="relative z-20 w-full flex items-end justify-between">
                  <div>
                     <h3 className="text-3xl font-black tracking-tighter uppercase">{selectedEvent?.eventDetails?.name || 'Show en vivo'}</h3>
                     <div className="flex items-center gap-4 mt-2 text-white/60 text-sm">
                        <span className="flex items-center gap-1.5"><FiCalendar size={14}/> {selectedEvent?.eventDetails?.date ? formatDateShort(parseFirestoreTimestamp(selectedEvent.eventDetails.date)!) : ''}</span>
                        <span className="flex items-center gap-1.5"><FiClock size={14}/> {selectedEvent?.duration || '90 mins'}</span>
                     </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                     selectedEvent?.status === 'accepted' || selectedEvent?.status === 'completed' 
                       ? 'bg-accent/20 border-accent/40 text-accent' 
                       : 'bg-amber-500/20 border-amber-500/40 text-amber-500'
                   }`}>
                      {selectedEvent?.status === 'accepted' ? 'Confirmado' : selectedEvent?.status === 'pending_artist_signature' ? 'Firma Pendiente' : 'Pendiente'}
                  </div>
               </div>
               <button 
                  onClick={() => setSelectedEventId(null)}
                  className="absolute top-6 right-6 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors z-30"
               >
                  <FiX size={20} />
               </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
               {/* Left Column */}
               <div className="space-y-8">
                  <section>
                     <h4 className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-4">Información del evento</h4>
                     <p className="text-sm text-white/60 leading-relaxed">
                        {selectedEvent?.serviceDescription || 'No hay descripción adicional para este servicio.'}
                     </p>
                  </section>

                  <section className="space-y-4">
                     <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0"><FiMapPin className="text-accent" /></div>
                        <div>
                           <div className="text-[10px] uppercase text-white/30 font-bold">Lugar</div>
                           <div className="text-sm">{selectedEvent?.eventDetails?.location || '—'}</div>
                        </div>
                     </div>
                     <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0"><FiPhone className="text-accent" /></div>
                        <div>
                           <div className="text-[10px] uppercase text-white/30 font-bold">Contacto cliente</div>
                           <div className="text-sm">{selectedEvent?.clientContact?.phone || '—'}</div>
                           <div className="text-xs text-white/40">{selectedEvent?.clientContact?.name || 'Cliente'}</div>
                        </div>
                     </div>
                  </section>
               </div>

               {/* Right Column (Files & Actions) */}
               <div className="space-y-8 flex flex-col">
                  <section>
                     <h4 className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-4">Documentación</h4>
                     <div className="space-y-3">
                        {selectedEvent?.contractDownloadUrl ? (
                          <a 
                             href={selectedEvent.contractDownloadUrl} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
                          >
                             <div className="flex items-center gap-3">
                                <FiDownload className="text-accent" />
                                <span className="text-sm font-medium">
                                  {selectedEvent?.status === 'accepted' || selectedEvent?.status === 'completed' ? 'Contrato firmado' : 'Contrato original'}
                                </span>
                             </div>
                             <FiChevronRight className="text-white/20 group-hover:text-white transition-colors" />
                          </a>
                        ) : (selectedEvent?.status === 'pending_artist_signature' || selectedEvent?.status === 'pending') ? (
                          <button 
                             onClick={() => setArtistSigningOpen(true)}
                             className="w-full flex items-center justify-between p-3 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-colors group"
                          >
                             <div className="flex items-center gap-3">
                                <FiEdit3 className="text-accent" />
                                <span className="text-sm font-medium text-accent">Firmar Contrato</span>
                             </div>
                             <FiChevronRight className="text-accent/50 group-hover:text-accent transition-colors" />
                          </button>
                        ) : (
                          <div className="p-3 rounded-xl bg-white/5 border border-white/5 opacity-50 flex items-center gap-3">
                             <FiLock className="text-white/30" />
                             <span className="text-sm text-white/30">Contrato no disponible</span>
                          </div>
                        )}

                        {selectedEvent?.riderDownloadUrl ? (
                          <a 
                             href={selectedEvent.riderDownloadUrl} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
                          >
                             <div className="flex items-center gap-3">
                                <FiDownload className="text-accent" />
                                <span className="text-sm font-medium">Rider Técnico</span>
                             </div>
                             <FiChevronRight className="text-white/20 group-hover:text-white transition-colors" />
                          </a>
                        ) : (
                          <div className="p-3 rounded-xl bg-white/5 border border-white/5 opacity-50 flex items-center gap-3">
                             <FiLock className="text-white/30" />
                             <span className="text-sm text-white/30">Rider no disponible</span>
                          </div>
                        )}
                     </div>
                  </section>

                  <div className="mt-auto pt-6 border-t border-white/5 flex flex-col gap-3">
                     {(selectedEvent?.status === 'pending_artist_signature' || selectedEvent?.status === 'pending') && (
                        <Button 
                           variant="primary" 
                           fullWidth 
                           className="py-6 rounded-2xl shadow-lg shadow-accent/20"
                           onClick={() => setArtistSigningOpen(true)}
                        >
                           Firmar y Aceptar Show
                        </Button>
                     )}
                     <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Estado del pago</span>
                        <div className="flex items-center gap-1.5 text-accent text-xs font-bold">
                           <FiCheckCircle size={14} />
                           <span>{selectedEvent?.financials?.paymentStatus === 'PAID' ? 'PAGADO' : 'PENDIENTE'}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Signing Modal */}
      <ClientContractSigningModal
        isOpen={artistSigningOpen}
        onClose={() => setArtistSigningOpen(false)}
        artistParty={{
          roleLabel: 'Artista',
          name: user.displayName || 'Artista',
          signed: false,
        }}
        clientParty={{
          roleLabel: 'Cliente',
          name: selectedEvent?.clientContact?.name || 'Cliente',
          signed: true,
        }}
        summary={{
          event: selectedEvent?.eventDetails?.name || 'Evento',
          dateLabel: selectedEvent?.eventDetails?.date ? formatDateShort(parseFirestoreTimestamp(selectedEvent.eventDetails.date)!) : '—',
          location: selectedEvent?.eventDetails?.location || '—',
          totalValue: `$${Math.round(Number(selectedEvent?.financials?.totalAmount || 0))}`,
          duration: selectedEvent?.duration || '90 mins',
          service: selectedEvent?.serviceName || 'Servicio artístico',
        }}
        onSign={async ({ dataUrl, acceptedTerms }) => {
          if (!selectedEventId) return;
          setArtistSigningLoading(true);
          try {
            await artistAcceptContract(selectedEventId, {
              artistSignatureDataUrl: dataUrl,
              acceptedTerms,
            });
            setArtistSigningOpen(false);
            dispatchContractsApiRefresh();
            // Full refresh: calendar events + current modal details
            await Promise.all([
              fetchCalendarData(),
              openEvent(selectedEventId)
            ]);
          } catch (err) {
            console.error(err);
          } finally {
            setArtistSigningLoading(false);
          }
        }}
      />
    </div>
  );
}
