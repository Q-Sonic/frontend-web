import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { FiPause, FiPlay, FiSkipBack, FiSkipForward } from 'react-icons/fi';
import type { GalleryAudioTrack } from '../../helpers/galleryAudioTracks';

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type ArtistGalleryWavePlayerProps = {
  tracks: GalleryAudioTrack[];
  /** Fallback cover when track has no cover */
  fallbackCoverUrl?: string;
};

export function ArtistGalleryWavePlayer({ tracks, fallbackCoverUrl }: ArtistGalleryWavePlayerProps) {
  const waveContainerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const audioFallbackRef = useRef<HTMLAudioElement | null>(null);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // WaveSurfer is used for visualization. If it fails to fetch/decode (CORS), we still play via <audio>.
  const [waveformReady, setWaveformReady] = useState(false);
  const [waveformFailed, setWaveformFailed] = useState(false);

  const safeIndex = tracks.length ? Math.min(index, tracks.length - 1) : 0;
  const track = tracks[safeIndex];
  const cover = track?.coverUrl?.trim() || fallbackCoverUrl;
  const hasTrack = !!track?.streamUrl && tracks.length > 0;

  const destroyWs = useCallback(() => {
    wsRef.current?.destroy();
    wsRef.current = null;
  }, []);

  const stopAudio = useCallback(() => {
    const a = audioFallbackRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
  }, []);

  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setWaveformReady(false);
    setWaveformFailed(false);

    destroyWs();
    stopAudio();

    const url = track?.streamUrl;
    if (!url) return;

    // Fallback playback (hearing audio even if waveform cannot decode).
    const audio = new Audio(url);
    audio.preload = 'metadata';
    audioFallbackRef.current = audio;

    const onLoadedMetadata = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', () => setPlaying(false));

    // Try to build waveform visualization.
    if (waveContainerRef.current) {
      try {
        const ws = WaveSurfer.create({
          container: waveContainerRef.current,
          height: 40,
          waveColor: 'rgba(255,255,255,0.25)',
          progressColor: 'rgba(0,212,200,0.95)',
          cursorColor: 'rgba(255,255,255,0.78)',
          cursorWidth: 2,
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          normalize: true,
          dragToSeek: false,
          interact: false,
        });

        wsRef.current = ws;

        const unsub: Array<() => void> = [];
        unsub.push(
          ws.on('ready', () => {
            setWaveformReady(true);
            setWaveformFailed(false);
            setDuration(ws.getDuration());
            setCurrentTime(0);
          }),
        );
        unsub.push(
          ws.on('timeupdate', (t) => {
            setCurrentTime(t);
          }),
        );
        unsub.push(ws.on('error', (err) => {
          setWaveformFailed(true);
          setWaveformReady(false);
          // We keep audio fallback working.
          void err;
        }));

        void ws.load(url).catch(() => {
          setWaveformFailed(true);
          setWaveformReady(false);
        });

        return () => {
          unsub.forEach((u) => u());
          ws.destroy();
          wsRef.current = null;
          audio.pause();
          audioFallbackRef.current = null;
          audio.removeEventListener('loadedmetadata', onLoadedMetadata);
          audio.removeEventListener('timeupdate', onTimeUpdate);
          audio.removeEventListener('play', onPlay);
          audio.removeEventListener('pause', onPause);
          audio.removeEventListener('ended', onEnded);
        };
      } catch {
        setWaveformFailed(true);
        setWaveformReady(false);
      }
    }

    return () => {
      audio.pause();
      audioFallbackRef.current = null;
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [track?.streamUrl, destroyWs, stopAudio]);

  const goPrev = useCallback(() => {
    if (tracks.length <= 1) return;
    setIndex((i) => (i - 1 + tracks.length) % tracks.length);
  }, [tracks.length]);

  const goNext = useCallback(() => {
    if (tracks.length <= 1) return;
    setIndex((i) => (i + 1) % tracks.length);
  }, [tracks.length]);

  const togglePlay = useCallback(() => {
    if (!hasTrack) return;

    // Prefer WaveSurfer playback when it can decode; otherwise use <audio>.
    if (waveformReady && wsRef.current) {
      void wsRef.current.playPause();
      return;
    }

    const a = audioFallbackRef.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => setPlaying(false));
    else a.pause();
  }, [hasTrack, waveformReady]);

  const statusAria = useMemo(() => (playing ? 'Reproduciendo' : 'Pausado'), [playing]);

  if (tracks.length === 0) {
    return (
      <div className="w-full max-w-[380px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-5 text-center">
        <p className="text-xs text-neutral-400 leading-relaxed">
          Este artista aún no tiene canciones publicadas en el perfil.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-[#0f141c]/60 p-4 backdrop-blur-md">
      {/* Panel superior (ondas + tiempos) */}
      <div className="flex items-center justify-between gap-2 text-[11px] font-semibold tabular-nums text-white/70 px-2 mb-2">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0c0f15] overflow-hidden">
        <div ref={waveContainerRef} className="w-full h-10" aria-label="Forma de onda de audio" />
      </div>

      {/* Tarjetita azul (controles + portada + texto) */}
      <div className="mt-4 rounded-2xl bg-gradient-to-r from-[#1a3cff] via-[#1cc3ff] to-[#00d4c8] p-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={tracks.length <= 1}
            className="p-2 rounded-full text-white/85 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            aria-label="Anterior"
          >
            <FiSkipBack size={22} strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[#00d4c8] text-[#0a0c10] shadow-[0_0_30px_rgba(0,212,200,0.55)] hover:bg-[#00ece0] transition-colors"
            aria-label={playing ? 'Pausar' : 'Reproducir'}
            aria-live="polite"
            aria-pressed={playing}
          >
            {playing ? <FiPause size={28} /> : <FiPlay size={30} className="translate-x-0.5" />}
          </button>

          <button
            type="button"
            onClick={goNext}
            disabled={tracks.length <= 1}
            className="p-2 rounded-full text-white/85 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            aria-label="Siguiente"
          >
            <FiSkipForward size={22} strokeWidth={2} />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <div className="h-14 w-14 shrink-0 rounded-2xl overflow-hidden bg-white/10 border border-white/20 shadow-inner">
            {cover ? (
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-lg text-white/35">♪</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate leading-snug" aria-label={statusAria}>
              {track.title}
            </p>
            <p className="text-sm text-white/70 truncate mt-0.5">{track.artistLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
