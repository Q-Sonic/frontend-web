import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiAlertCircle, FiCheck, FiChevronDown, FiShoppingCart } from 'react-icons/fi';
import { PaymentezCheckoutButton } from '../../components/PaymentezCheckoutButton';
import { getArtistServiceById } from '../../api';
import { ARTIST_SERVICE_LINK_STATE_KEY, Skeleton } from '../../components';
import { ClientContractSigningModal } from '../../components/client/ClientContractSigningModal';
import { ServiceDatePickerCalendar } from '../../components/client/ServiceDatePickerCalendar';
import { useAuth } from '../../contexts/AuthContext';
import { useArtistProfileById } from '../../hooks/useArtistProfileById';
import { useArtistProfileNav } from '../../contexts/ArtistProfileNavContext';
import { persistSignedClientContractsWithApiFallback } from '../../helpers/clientContractPersistence';
import { addServiceCartLine } from '../../helpers/clientServiceCart';
import { appendContractSignedPendingArtistNotifications } from '../../helpers/clientNotifications';
import { resolveArtistProfileMediaUrl } from '../../helpers/artistDocumentUrls';
import { serviceContractPdfUrl, serviceTechnicalRiderPdfUrl } from '../../helpers/clientArtistDocuments';
import { isBackendRoleCliente } from '../../helpers/role';
import { formatMoney } from '../../helpers/money';
import { getArtistAvailabilityById } from '../../api/artistProfileService';
import type { ArtistAvailabilityResponse } from '../../api/artistProfileService';
import type { ArtistProfile, ArtistServiceRecord } from '../../types';

const ACCENT_HEX = '#00d4c8';

function formatDateKeyEs(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) return key;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('es', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatDateKeyEsVeryShort(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) return key;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('es', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatDateKeyEsLong(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) return key;
  const dt = new Date(y, m - 1, d);
  const raw = dt.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function initialsFromDisplayName(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || '?';
}

/** "1 hora por presentación", "2 horas por presentación", "1 a 1,5 horas por presentación", etc. */
function durationPerPresentationLabel(durationRaw: string | undefined): string {
  const suffix = ' por presentación';
  const raw = durationRaw?.trim();
  if (!raw) return `1 hora${suffix}`;

  const horaMatch = raw.match(/(\d+(?:[.,]\d+)?)\s*h(?:ora)?s?\b/i);
  if (horaMatch) {
    const h = parseFloat(horaMatch[1]!.replace(',', '.'));
    if (Number.isFinite(h) && h > 0) return `${formatHorasPhrase(h)}${suffix}`;
  }

  const rangeMin = raw.match(/(\d+)\s*[-–]\s*(\d+)\s*min(?:uto)?s?\b/i);
  if (rangeMin) {
    const h1 = parseInt(rangeMin[1]!, 10) / 60;
    const h2 = parseInt(rangeMin[2]!, 10) / 60;
    if (h1 > 0 && h2 > 0) {
      return `${formatHorasPhrase(h1)} a ${formatHorasPhrase(h2)}${suffix}`;
    }
  }

  const minMatch = raw.match(/(\d+)\s*min(?:uto)?s?\b/i);
  if (minMatch) {
    const h = parseInt(minMatch[1]!, 10) / 60;
    if (h > 0) return `${formatHorasPhrase(h)}${suffix}`;
  }

  return `1 hora${suffix}`;
}

function formatHorasPhrase(hours: number): string {
  const h = Math.round(hours * 100) / 100;
  if (h <= 0) return '1 hora';
  const isOne = Math.abs(h - 1) < 0.05;
  const numStr =
    Number.isInteger(h) || Math.abs(h - Math.round(h)) < 0.001
      ? String(Math.round(h))
      : h.toLocaleString('es', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${numStr} ${isOne ? 'hora' : 'horas'}`;
}

type ServiceDetailArticleProps = {
  artistId: string;
  artistDisplayName: string;
  svc: ArtistServiceRecord;
  availableServices: ArtistServiceRecord[];
  onSelectService: (serviceId: string) => void;
  profile: (ArtistProfile & { uid: string }) | null;
  basePath: string;
  preselectedDateKey?: string;
  prefilledServiceDetails?: string;
};

function ServiceDetailArticle({
  artistId,
  artistDisplayName,
  svc,
  availableServices,
  onSelectService,
  profile,
  basePath,
  preselectedDateKey,
  prefilledServiceDetails,
}: ServiceDetailArticleProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDateKeys, setSelectedDateKeys] = useState<Set<string>>(() =>
    preselectedDateKey ? new Set([preselectedDateKey]) : new Set(),
  );
  const [serviceDetails, setServiceDetails] = useState(prefilledServiceDetails ?? '');
  const [cartAddedFlash, setCartAddedFlash] = useState(false);
  const [cartDateOverlapMessage, setCartDateOverlapMessage] = useState<string | null>(null);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [isContractDatesExpanded, setIsContractDatesExpanded] = useState(false);
  const [isServiceMenuOpen, setIsServiceMenuOpen] = useState(false);
  const serviceMenuRef = useRef<HTMLDivElement | null>(null);
  const [availability, setAvailability] = useState<ArtistAvailabilityResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    getArtistAvailabilityById(artistId)
      .then((data) => { if (!cancelled) setAvailability(data); })
      .catch(() => { /* silently ignore — calendar still works without it */ });
    return () => { cancelled = true; };
  }, [artistId]);

  const coverPhoto = svc.imageUrl?.trim() || profile?.photo?.trim() || undefined;
  const featureItems = Array.isArray(svc.features) ? svc.features : [];
  const featureLines =
    svc.duration?.trim() ? [`Duración: ${svc.duration.trim()}`, ...featureItems] : featureItems;
  const serviceOptions = useMemo(() => {
    const list = availableServices.length > 0 ? availableServices : [svc];
    const uniqueById = new Map<string, ArtistServiceRecord>();
    list.forEach((service) => uniqueById.set(service.id, service));
    if (!uniqueById.has(svc.id)) uniqueById.set(svc.id, svc);
    return [...uniqueById.values()];
  }, [availableServices, svc]);

  useEffect(() => {
    setIsServiceMenuOpen(false);
  }, [svc.id]);

  useEffect(() => {
    setSelectedDateKeys(preselectedDateKey ? new Set([preselectedDateKey]) : new Set());
  }, [preselectedDateKey, svc.id]);

  useEffect(() => {
    setServiceDetails(prefilledServiceDetails ?? '');
  }, [prefilledServiceDetails, svc.id]);

  useEffect(() => {
    const handlePointerDownOutside = (event: MouseEvent) => {
      if (!serviceMenuRef.current) return;
      const target = event.target;
      if (target instanceof Node && !serviceMenuRef.current.contains(target)) {
        setIsServiceMenuOpen(false);
      }
    };
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsServiceMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const toggleDateKey = useCallback((key: string) => {
    setSelectedDateKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const openContractModal = useCallback(() => {
    if (selectedDateKeys.size === 0) return;
    setIsContractDatesExpanded(false);
    setContractModalOpen(true);
  }, [selectedDateKeys.size]);

  const contractSummary = useMemo(() => {
    const sortedKeys = [...selectedDateKeys].sort();
    const visibleDateKeys = isContractDatesExpanded ? sortedKeys : sortedKeys.slice(0, 3);
    const remainingDateCount = Math.max(0, sortedKeys.length - visibleDateKeys.length);
    const dateLabel =
      sortedKeys.length === 0 ? (
        '—'
      ) : sortedKeys.length === 1 ? (
        <div className="space-y-2">
          <p className="text-sm text-white/70">1 fecha seleccionada</p>
          <ul className="flex flex-wrap gap-1.5">
            <li className="rounded-md border border-[#00d4c8]/30 bg-[#00d4c8]/10 px-2 py-1 text-xs font-medium text-[#8ff6ef]">
              {formatDateKeyEsVeryShort(sortedKeys[0]!)}
            </li>
          </ul>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-white/70">{sortedKeys.length} fechas seleccionadas</p>
          <ul className="flex flex-wrap gap-1.5">
            {visibleDateKeys.map((key) => (
              <li
                key={key}
                className="rounded-md border border-[#00d4c8]/30 bg-[#00d4c8]/10 px-2 py-1 text-xs font-medium text-[#8ff6ef]"
              >
                {formatDateKeyEsVeryShort(key)}
              </li>
            ))}
            {remainingDateCount > 0 ? (
              <li>
                <button
                  type="button"
                  onClick={() => setIsContractDatesExpanded(true)}
                  className="rounded-md border border-white/20 bg-white/5 px-2 py-1 text-xs font-medium text-white/75 transition hover:border-[#00d4c8]/45 hover:text-[#b8fffa]"
                >
                  +{remainingDateCount} más
                </button>
              </li>
            ) : null}
            {isContractDatesExpanded && sortedKeys.length > 3 ? (
              <li>
                <button
                  type="button"
                  onClick={() => setIsContractDatesExpanded(false)}
                  className="rounded-md border border-white/20 bg-white/5 px-2 py-1 text-xs font-medium text-white/70 transition hover:border-white/35 hover:text-white"
                >
                  Ver menos
                </button>
              </li>
            ) : null}
          </ul>
        </div>
      );
    const featureBits = Array.isArray(svc.features) ? svc.features.filter(Boolean).slice(0, 4) : [];
    const serviceLine =
      featureBits.length > 0 ? `${svc.name} (${featureBits.join(', ')})` : svc.name;
    const city = profile?.city?.trim();
    const dateCount = sortedKeys.length;
    const totalPrice = svc.price * dateCount;
    return {
      event: svc.name,
      dateLabel,
      location: city || 'Por definir',
      totalValue: `$ ${formatMoney(totalPrice)} USD`,
      duration: durationPerPresentationLabel(svc.duration),
      service: serviceLine,
    };
  }, [isContractDatesExpanded, selectedDateKeys, svc, profile?.city]);

  const artistParty = useMemo(() => {
    const photo = resolveArtistProfileMediaUrl(profile?.photo);
    const name = artistDisplayName.trim() || 'Artista';
    return {
      roleLabel: 'Artista',
      name,
      signed: true as const,
      avatarUrl: photo || undefined,
      initials: initialsFromDisplayName(name),
    };
  }, [artistDisplayName, profile?.photo]);

  const clientParty = useMemo(() => {
    const name =
      user?.displayName?.trim() || user?.email?.trim() || 'Cliente';
    return {
      roleLabel: 'Cliente',
      name,
      signed: false as const,
      avatarUrl: user?.photoURL || undefined,
      initials: initialsFromDisplayName(name),
    };
  }, [user?.displayName, user?.email, user?.photoURL]);

  const handleViewContractPdf = useCallback(() => {
    const url = serviceContractPdfUrl(svc);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    void navigate(`${basePath}/contracts`);
  }, [basePath, navigate, svc]);

  const handleViewTechnicalRiderPdf = useCallback(() => {
    const url = serviceTechnicalRiderPdfUrl(svc);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    void navigate(`${basePath}/rider`);
  }, [basePath, navigate, svc]);

  const reserveLabel =
    selectedDateKeys.size === 1 ? 'Reservar fecha' : 'Reservar fechas';

  const handleAddToCart = useCallback(() => {
    if (selectedDateKeys.size === 0) return;
    setCartDateOverlapMessage(null);
    const result = addServiceCartLine({
      artistId,
      serviceId: svc.id,
      serviceName: svc.name,
      price: svc.price,
      selectedDateKeys: [...selectedDateKeys].sort(),
      artistDisplayName: artistDisplayName.trim() || 'Artista',
      artistPhotoUrl: resolveArtistProfileMediaUrl(profile?.photo) || undefined,
      locationLabel: profile?.city?.trim() || 'Por definir',
      serviceFeatures: Array.isArray(svc.features)
        ? svc.features.filter((f): f is string => typeof f === 'string' && f.trim().length > 0)
        : undefined,
      serviceDetails: serviceDetails.trim() || undefined,
      contractPdfUrl: serviceContractPdfUrl(svc),
      technicalRiderPdfUrl: serviceTechnicalRiderPdfUrl(svc),
    });
    if (!result.ok) {
      setCartAddedFlash(false);
      setCartDateOverlapMessage(
        'Estás intentando añadir fechas que ya tienes reservadas para este mismo Servicio en el carrito. ' +
          'Abre el carrito y elimina la reserva que ya incluye esas fechas o añade fechas nuevas.',
      );
      return;
    }
    setSelectedDateKeys(new Set());
    setServiceDetails('');
    setIsContractDatesExpanded(false);
    setCartAddedFlash(true);
    window.setTimeout(() => setCartAddedFlash(false), 2800);
  }, [
    artistId,
    artistDisplayName,
    profile?.city,
    profile?.photo,
    svc.id,
    svc.features,
    svc.name,
    svc.price,
    selectedDateKeys,
    serviceDetails,
  ]);

  return (
    <article className="space-y-6 sm:space-y-8">
      <nav className="-mx-1">
        <Link
          to={`${basePath}#documents`}
          className="inline-flex min-h-11 items-center px-1 py-2 text-[15px] sm:text-base font-medium text-neutral-400 transition hover:text-white touch-manipulation"
        >
          ← Volver al perfil
        </Link>
      </nav>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-6 xl:gap-x-8 lg:items-start">
        <section
          className="order-1 min-w-0 max-w-full space-y-5 sm:space-y-7 lg:sticky lg:top-6 lg:self-start"
          aria-labelledby="booking-dates-heading"
        >
          <div className="space-y-2.5 sm:space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#00d4c8] sm:text-[13px]">
              Reserva
            </p>
            <h2
              id="booking-dates-heading"
              className="text-[1.375rem] font-bold leading-tight tracking-tight text-white sm:text-3xl"
            >
              Elegir fechas
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-neutral-400 max-w-xl">
              Solo puedes seleccionar desde hoy en adelante. Toca un día en el calendario para marcarlo o
              quitarlo.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <button
              type="button"
              disabled={selectedDateKeys.size === 0}
              title={
                selectedDateKeys.size === 0
                  ? 'Selecciona al menos una fecha en el calendario'
                  : undefined
              }
              onClick={handleAddToCart}
              className={
                'touch-manipulation inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-white/20 ' +
                'bg-transparent px-5 py-3.5 text-sm font-semibold text-white transition active:opacity-90 ' +
                'hover:border-[#00d4c8]/50 hover:bg-[#00d4c8]/10 hover:text-[#00d4c8] ' +
                'disabled:cursor-not-allowed disabled:border-white/10 disabled:text-neutral-500 ' +
                'disabled:hover:border-white/10 disabled:hover:bg-transparent disabled:hover:text-neutral-500 ' +
                'sm:flex-1 sm:min-w-[170px]'
              }
            >
              <FiShoppingCart size={18} aria-hidden />
              Añadir al carrito
            </button>
            <button
              type="button"
              disabled={selectedDateKeys.size === 0}
              title={
                selectedDateKeys.size === 0
                  ? 'Selecciona al menos una fecha en el calendario'
                  : undefined
              }
              onClick={openContractModal}
              className={
                'touch-manipulation min-h-12 w-full rounded-full bg-[#00d4c8] px-6 py-3.5 text-sm font-semibold text-[#0a0c10] ' +
                'shadow-[0_0_28px_rgba(0,212,200,0.45)] transition active:opacity-95 ' +
                'hover:bg-[#33e8dc] hover:shadow-[0_0_36px_rgba(0,212,200,0.55)] ' +
                'disabled:cursor-not-allowed disabled:bg-[#00d4c8]/30 disabled:text-[#0a0c10]/45 ' +
                'disabled:shadow-none sm:flex-1 sm:min-w-[190px]'
              }
            >
              {reserveLabel}
            </button>
          </div>
          {cartDateOverlapMessage ? (
            <div
              role="alert"
              className={
                'flex gap-3 rounded-xl border border-amber-400/25 bg-amber-500/[0.07] px-4 py-3.5 ' +
                'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] sm:gap-3.5 sm:px-4 sm:py-4'
              }
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300"
                aria-hidden
              >
                <FiAlertCircle className="h-5 w-5" strokeWidth={2} />
              </span>
              <div className="min-w-0 space-y-1.5 pt-0.5">
                <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-amber-200/95 sm:text-xs">
                  Fechas ya en el carrito
                </p>
                <p className="text-sm leading-relaxed text-amber-50/90">{cartDateOverlapMessage}</p>
              </div>
            </div>
          ) : null}
          {cartAddedFlash ? (
            <div
              role="status"
              className="flex items-center gap-3 rounded-xl border border-[#00d4c8]/30 bg-[#00d4c8]/10 px-4 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#00d4c8]/15 text-[#00d4c8]"
                aria-hidden
              >
                <FiCheck className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <p className="text-sm font-medium leading-snug text-[#98f8f1]">Añadido al carrito</p>
            </div>
          ) : null}

          <ServiceDatePickerCalendar
            selectedKeys={selectedDateKeys}
            onToggleKey={toggleDateKey}
            blockedDates={availability?.blocked}
            reservedDates={availability?.reserved}
            pendingDates={availability?.pending}
            selectedSummary={
              selectedDateKeys.size > 0 ? (
                <div className="space-y-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3 sm:px-4">
                  <p className="text-sm sm:text-base leading-relaxed text-neutral-300">
                    <span className="font-semibold text-[#00d4c8]">
                      {selectedDateKeys.size === 1 ? 'Fecha elegida' : 'Fechas elegidas'}
                    </span>
                    <span className="ml-1 text-neutral-400">({selectedDateKeys.size})</span>
                  </p>
                  <ul className="flex flex-wrap gap-1.5">
                    {[...selectedDateKeys]
                      .sort()
                      .map((key) => (
                        <li
                          key={key}
                          className="rounded-md border border-[#00d4c8]/25 bg-[#00d4c8]/10 px-2 py-1 text-xs font-medium text-[#98f8f1] sm:text-sm"
                        >
                          {formatDateKeyEs(key)}
                        </li>
                      ))}
                  </ul>
                </div>
              ) : undefined
            }
          />
          <div className="rounded-xl border border-white/10 bg-black/20 p-3.5 sm:rounded-2xl sm:p-4">
            <label className="mb-2 block text-sm font-semibold text-white">Detalles del servicio</label>
            <textarea
              value={serviceDetails}
              onChange={(e) => setServiceDetails(e.target.value)}
              rows={4}
              placeholder="Ej: tipo de evento, horario estimado, necesidades técnicas..."
              className="min-h-[7.5rem] w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#00d4c8]/30 sm:resize-none"
            />
          </div>
        </section>

        <div className="order-2 w-full max-w-full shrink-0 sm:max-w-lg lg:justify-self-end xl:max-w-xl">
          <div
            className={
              'w-full space-y-5 sm:space-y-7 rounded-2xl border border-[#00d4c8]/20 sm:rounded-3xl ' +
              'bg-linear-to-b from-white/6 via-[#0c0e12] to-black/50 p-5 sm:p-8 ' +
              'shadow-[0_0_40px_rgba(0,212,200,0.06),inset_0_1px_0_rgba(255,255,255,0.06)]'
            }
          >
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#00d4c8]/90">
                  Cambiar servicio
                </p>
                <div className="relative mt-2" ref={serviceMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsServiceMenuOpen((prev) => !prev)}
                    className="touch-manipulation flex min-h-12 w-full items-center justify-between rounded-xl border border-white/15 bg-black/40 px-3.5 py-3 text-left text-sm font-medium text-white outline-none transition hover:border-[#00d4c8]/40 focus:border-[#00d4c8]/60 focus:ring-2 focus:ring-[#00d4c8]/25 sm:min-h-0 sm:py-2.5"
                    aria-haspopup="listbox"
                    aria-expanded={isServiceMenuOpen}
                    aria-label="Cambiar servicio"
                  >
                    <span className="truncate pr-3">{svc.name}</span>
                    <FiChevronDown
                      size={17}
                      className={`shrink-0 text-neutral-300 transition-transform ${isServiceMenuOpen ? 'rotate-180 text-[#00d4c8]' : ''}`}
                      aria-hidden
                    />
                  </button>
                  {isServiceMenuOpen ? (
                    <div
                      role="listbox"
                      aria-label="Opciones de servicio"
                      className="absolute left-0 right-0 z-20 mt-2 max-h-56 overflow-y-auto rounded-xl border border-[#00d4c8]/25 bg-[#0a0c10]/95 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur"
                    >
                      <div className="rounded-lg px-3 py-2 text-sm text-neutral-400">
                        Seleccionar servicio
                      </div>
                      {serviceOptions.map((service) => {
                        const isSelected = service.id === svc.id;
                        return (
                          <button
                            key={service.id}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setIsServiceMenuOpen(false);
                              onSelectService(service.id);
                            }}
                            className={
                              'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ' +
                              (isSelected
                                ? 'bg-[#00d4c8]/15 text-[#00d4c8]'
                                : 'text-neutral-100 hover:bg-white/8 hover:text-white')
                            }
                          >
                            <span className="truncate">{service.name}</span>
                            {isSelected ? <FiCheck size={15} className="shrink-0" aria-hidden /> : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="h-px w-full bg-white/10" aria-hidden />
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#00d4c8]/90">
                  Servicio actual
                </p>
                <h1 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
                  {svc.name}
                </h1>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/35 px-4 py-3.5 sm:rounded-2xl sm:px-5 sm:py-4">
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Precio</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-accent sm:text-4xl">
                ${formatMoney(svc.price)}
              </p>
              <p className="mt-0.5 text-sm text-neutral-400">por hora</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Descripción
              </p>
              <p className="text-sm leading-relaxed text-neutral-200 whitespace-pre-wrap sm:text-lg">
                {svc.description?.trim() || 'Sin descripción.'}
              </p>
            </div>
            {featureLines.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Incluye / detalles
                </p>
                <ul className="space-y-2.5 text-sm sm:text-base text-neutral-200">
                  {featureLines.map((line) => (
                    <li key={line} className="flex gap-3 rounded-xl border border-white/6 bg-white/3 px-3 py-2.5">
                      <span className="shrink-0 text-[#00d4c8] font-semibold">✓</span>
                      <span className="min-w-0 leading-snug">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="relative aspect-[16/10] max-h-[220px] w-full overflow-hidden rounded-xl border border-white/10 bg-neutral-950 shadow-[0_12px_40px_rgba(0,0,0,0.45)] sm:aspect-[4/3] sm:max-h-none sm:rounded-2xl">
              {coverPhoto ? (
                <img src={coverPhoto} alt="" className="h-full w-full object-cover object-center" />
              ) : (
                <div
                  className="h-full w-full"
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT_HEX}33 0%, transparent 60%), linear-gradient(225deg, #27272a 0%, #0a0a0a 100%)`,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <ClientContractSigningModal
        isOpen={contractModalOpen}
        onClose={() => setContractModalOpen(false)}
        artistParty={artistParty}
        clientParty={clientParty}
        summary={contractSummary}
        onViewContract={handleViewContractPdf}
        onViewTechnicalRider={handleViewTechnicalRiderPdf}
        onSign={async ({ dataUrl }) => {
          if (user && isBackendRoleCliente(user.role)) {
            const line = {
              id: `individual-${svc.id}-${Date.now()}`,
              artistId,
              serviceId: svc.id,
              serviceName: svc.name,
              price: svc.price,
              selectedDateKeys: [...selectedDateKeys].sort(),
              addedAt: new Date().toISOString(),
              artistDisplayName: artistDisplayName.trim() || 'Artista',
              artistPhotoUrl: resolveArtistProfileMediaUrl(profile?.photo) || undefined,
              locationLabel: profile?.city?.trim() || 'Por definir',
              serviceFeatures: Array.isArray(svc.features) ? [...svc.features] : undefined,
              serviceDetails: serviceDetails.trim() || undefined,
              contractPdfUrl: serviceContractPdfUrl(svc),
              technicalRiderPdfUrl: serviceTechnicalRiderPdfUrl(svc),
            };
            const contracts = await persistSignedClientContractsWithApiFallback([line], {
              dataUrl,
              applyToAll: false,
            });

            // After signing, redirect to contracts page where the user can pay
            if (contracts && contracts.length > 0) {
              setContractModalOpen(false);
              navigate('/client/contracts', { replace: true });
              return;
            }

            appendContractSignedPendingArtistNotifications([
              {
                artistId,
                artistDisplayName,
                serviceName: svc.name,
                lineId: line.id,
              },
            ]);
          }
          setContractModalOpen(false);
          navigate(basePath, { replace: true });
        }}
      />
    </article>
  );
}

function readServiceFromLocationState(
  state: unknown,
  serviceId: string,
): ArtistServiceRecord | undefined {
  if (!state || typeof state !== 'object') return undefined;
  const raw = (state as Record<string, unknown>)[ARTIST_SERVICE_LINK_STATE_KEY];
  if (!raw || typeof raw !== 'object') return undefined;
  const s = raw as ArtistServiceRecord;
  return s.id === serviceId ? s : undefined;
}

function readBookingPrefillFromState(state: unknown): {
  preselectedDateKey?: string;
  prefilledServiceDetails?: string;
} {
  if (!state || typeof state !== 'object') return {};
  const raw = state as Record<string, unknown>;
  const preselectedDateKey =
    typeof raw.preselectedDateKey === 'string' ? raw.preselectedDateKey : undefined;
  const prefilledServiceDetails =
    typeof raw.prefilledServiceDetails === 'string' ? raw.prefilledServiceDetails : undefined;
  return { preselectedDateKey, prefilledServiceDetails };
}

export function ClientArtistServiceDetailPage() {
  const { id: artistId, serviceId } = useParams<{ id: string; serviceId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { basePath } = useArtistProfileNav();
  const {
    profile,
    services,
    artistDisplayName,
    loading: profileLoading,
    error: profileError,
  } = useArtistProfileById(artistId);

  const [fetched, setFetched] = useState<ArtistServiceRecord | null>(null);
  const [fetching, setFetching] = useState(false);

  const fromState = useMemo(
    () => (serviceId ? readServiceFromLocationState(location.state, serviceId) : undefined),
    [location.state, serviceId],
  );
  const bookingPrefill = useMemo(() => readBookingPrefillFromState(location.state), [location.state]);

  const serviceFromList = useMemo(
    () => (serviceId ? services.find((s) => s.id === serviceId) : undefined),
    [services, serviceId],
  );

  useEffect(() => {
    if (!serviceId) {
      setFetched(null);
      return;
    }
    let cancelled = false;
    setFetching(true);
    void getArtistServiceById(serviceId)
      .then((s) => {
        if (cancelled) return;
        if (!s) {
          setFetched(null);
          return;
        }
        if (artistId && s.artistId && s.artistId !== artistId) {
          setFetched(null);
          return;
        }
        setFetched(s);
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceId, artistId]);

  const displayService = useMemo((): ArtistServiceRecord | null => {
    const validFetched =
      fetched && (!artistId || !fetched.artistId || fetched.artistId === artistId)
        ? fetched
        : null;
    const base = fromState ?? serviceFromList;
    if (validFetched && base) return { ...base, ...validFetched };
    return validFetched ?? base ?? null;
  }, [fetched, fromState, serviceFromList, artistId]);

  const handleSelectService = useCallback(
    (nextServiceId: string) => {
      if (!artistId || !serviceId || !nextServiceId || nextServiceId === serviceId) return;
      const nextService = services.find((service) => service.id === nextServiceId);
      navigate(`${basePath}/services/${nextServiceId}`, {
        state: nextService ? { [ARTIST_SERVICE_LINK_STATE_KEY]: nextService } : undefined,
      });
    },
    [artistId, basePath, navigate, serviceId, services],
  );

  if (!artistId || !serviceId) return <Navigate to="/client" replace />;

  if (profileError) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-6 sm:px-8 sm:pb-12 sm:pt-10 lg:pl-12 lg:pr-10 lg:pt-12">
        <p className="text-red-400 text-sm leading-relaxed">{profileError}</p>
      </div>
    );
  }

  const waitingForAnySource = !displayService && (profileLoading || fetching);
  const notFound = !displayService && !profileLoading && !fetching;

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 px-4 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-6 sm:space-y-8 sm:px-7 sm:pb-12 sm:pt-10 lg:pl-10 lg:pr-8 lg:pt-12 xl:pl-12 xl:pr-10">
      {waitingForAnySource ? (
        <div className="space-y-8">
          <Skeleton className="h-5 w-40 rounded" />
          <div className="grid gap-8 lg:grid-cols-[1fr_minmax(280px,420px)]">
            <div className="space-y-6">
              <Skeleton className="h-12 w-full max-w-lg rounded-lg" />
              <Skeleton className="h-16 w-48 rounded-lg" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
            <Skeleton className="aspect-4/3 w-full max-w-lg rounded-3xl lg:max-w-none" />
          </div>
        </div>
      ) : notFound ? (
        <div className="space-y-4">
          <p className="text-red-400 text-sm leading-relaxed">
            No encontramos ese servicio para este artista.
          </p>
          <Link
            to={`${basePath}#documents`}
            className="inline-flex text-sm font-medium text-[#00d4c8] underline-offset-4 hover:underline"
          >
            Volver al perfil
          </Link>
        </div>
      ) : displayService ? (
        <ServiceDetailArticle
          key={displayService.id}
          artistId={artistId}
          artistDisplayName={artistDisplayName}
          svc={displayService}
          availableServices={services}
          onSelectService={handleSelectService}
          profile={profile}
          basePath={basePath}
          preselectedDateKey={bookingPrefill.preselectedDateKey}
          prefilledServiceDetails={bookingPrefill.prefilledServiceDetails}
        />
      ) : null}
    </div>
  );
}
