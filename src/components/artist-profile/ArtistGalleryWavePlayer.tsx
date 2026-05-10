import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { FiPause, FiPlay, FiSkipBack, FiSkipForward, FiVolume2 } from 'react-icons/fi';
import type { GalleryAudioTrack } from '../../helpers/galleryAudioTracks';

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type ArtistGalleryWavePlayerProps = {
  tracks: GalleryAudioTrack[];
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
  const [volume, setVolume] = useState(0.9);
  const [waveformReady, setWaveformReady] = useState(false);
  const [compactPlayer, setCompactPlayer] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width:639px)').matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width:639px)');
    const onChange = () => setCompactPlayer(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const waveHeight = compactPlayer ? 36 : 54;

  const safeIndex = tracks.length ? Math.min(index, tracks.length - 1) : 0;
  const track = tracks[safeIndex];
  const [cover, setCover] = useState<string | null>(track?.coverUrl?.trim() || fallbackCoverUrl || null);
  const hasTrack = !!track?.streamUrl && tracks.length > 0;

  const cleanupAll = useCallback(() => {
    wsRef.current?.destroy();
    wsRef.current = null;
    if (audioFallbackRef.current) {
      audioFallbackRef.current.pause();
      audioFallbackRef.current.src = '';
      audioFallbackRef.current = null;
    }
  }, []);

  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setWaveformReady(false);
    cleanupAll();

    const url = track?.streamUrl?.trim();
    if (!url) return;

    const fallbackAudio = new Audio(url);
    fallbackAudio.preload = 'metadata';
    fallbackAudio.volume = volume;
    audioFallbackRef.current = fallbackAudio;

    const onLoadedMetadata = () => {
      setDuration(Number.isFinite(fallbackAudio.duration) ? fallbackAudio.duration : 0);
    };
    const onTimeUpdate = () => setCurrentTime(fallbackAudio.currentTime || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);

    fallbackAudio.addEventListener('loadedmetadata', onLoadedMetadata);
    fallbackAudio.addEventListener('timeupdate', onTimeUpdate);
    fallbackAudio.addEventListener('play', onPlay);
    fallbackAudio.addEventListener('pause', onPause);
    fallbackAudio.addEventListener('ended', onEnded);

    if (waveContainerRef.current) {
      try {
        const ws = WaveSurfer.create({
          container: waveContainerRef.current,
          height: waveHeight,
          waveColor: 'rgba(255,255,255,0.38)',
          progressColor: 'rgba(255,255,255,0.95)',
          cursorColor: 'rgba(255,255,255,0.85)',
          cursorWidth: 2,
          barWidth: 3,
          barGap: 2,
          barRadius: 6,
          normalize: true,
          dragToSeek: true,
          interact: true,
        });
        wsRef.current = ws;
        ws.setVolume(volume);

        const unsub: Array<() => void> = [];
        unsub.push(
          ws.on('ready', () => {
            setWaveformReady(true);
            setDuration(ws.getDuration());
            setCurrentTime(0);
          }),
        );
        unsub.push(ws.on('timeupdate', (t) => setCurrentTime(t)));
        unsub.push(ws.on('play', () => setPlaying(true)));
        unsub.push(ws.on('pause', () => setPlaying(false)));
        unsub.push(ws.on('finish', () => setPlaying(false)));
        unsub.push(
          ws.on('error', () => {
            setWaveformReady(false);
          }),
        );

        void ws.load(url).catch(() => setWaveformReady(false));

        return () => {
          unsub.forEach((u) => u());
          ws.destroy();
          wsRef.current = null;
          fallbackAudio.pause();
          fallbackAudio.removeEventListener('loadedmetadata', onLoadedMetadata);
          fallbackAudio.removeEventListener('timeupdate', onTimeUpdate);
          fallbackAudio.removeEventListener('play', onPlay);
          fallbackAudio.removeEventListener('pause', onPause);
          fallbackAudio.removeEventListener('ended', onEnded);
          audioFallbackRef.current = null;
        };
      } catch {
        setWaveformReady(false);
      }
    }

    return () => {
      fallbackAudio.pause();
      fallbackAudio.removeEventListener('loadedmetadata', onLoadedMetadata);
      fallbackAudio.removeEventListener('timeupdate', onTimeUpdate);
      fallbackAudio.removeEventListener('play', onPlay);
      fallbackAudio.removeEventListener('pause', onPause);
      fallbackAudio.removeEventListener('ended', onEnded);
      audioFallbackRef.current = null;
    };
  }, [cleanupAll, track?.streamUrl, volume, waveHeight]);

  const setPlaybackPosition = useCallback((nextSec: number) => {
    const safeDuration = duration > 0 ? duration : 0;
    const sec = Math.max(0, Math.min(safeDuration, nextSec));
    if (waveformReady && wsRef.current && safeDuration > 0) {
      wsRef.current.seekTo(sec / safeDuration);
      return;
    }
    const a = audioFallbackRef.current;
    if (a) a.currentTime = sec;
  }, [duration, waveformReady]);

  const seekBy = useCallback((deltaSeconds: number) => {
    setPlaybackPosition(currentTime + deltaSeconds);
  }, [currentTime, setPlaybackPosition]);

  const togglePlay = useCallback(() => {
    if (!hasTrack) return;
    if (waveformReady && wsRef.current) {
      void wsRef.current.playPause();
      return;
    }
    const a = audioFallbackRef.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => setPlaying(false));
    else a.pause();
  }, [hasTrack, waveformReady]);

  const changeVolume = useCallback((nextVolume: number) => {
    const v = Math.max(0, Math.min(1, nextVolume));
    setVolume(v);
    if (wsRef.current) wsRef.current.setVolume(v);
    if (audioFallbackRef.current) audioFallbackRef.current.volume = v;
  }, []);

  const goPrevTrack = useCallback(() => {
    if (tracks.length <= 1) return;
    setIndex((i) => (i - 1 + tracks.length) % tracks.length);
  }, [tracks.length]);

  const goNextTrack = useCallback(() => {
    if (tracks.length <= 1) return;
    setIndex((i) => (i + 1) % tracks.length);
  }, [tracks.length]);

  const fallbackBars = useMemo(() => Array.from({ length: 44 }, (_, i) => i), []);

  if (tracks.length === 0) {
    return (
      <div className="w-full max-w-[500px] rounded-2xl border border-white/10 bg-white/4 px-4 py-5 text-center sm:rounded-3xl sm:py-6">
        <p className="text-xs text-neutral-400 leading-relaxed">
          Este artista aún no tiene canciones publicadas en el perfil.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[520px] pt-[4.25rem] sm:pt-20">
      {/* Waveform container */}
      <div className="absolute inset-x-0 top-0 z-[1] mx-auto w-[min(100%,480px)] min-h-[2.75rem] overflow-hidden rounded-3xl bg-[#2D2D2D] px-3 py-2 sm:min-h-[3rem] sm:w-[90%] sm:rounded-4xl sm:px-6">
        <div className="relative flex min-h-[2.25rem] items-center justify-center sm:min-h-[2.75rem]">
          <div ref={waveContainerRef} className="mx-auto w-full max-w-[280px] sm:w-[60%]" aria-label="Forma de onda de audio" />
          {!waveformReady ? (
            <div className="pointer-events-none absolute inset-x-2 inset-y-1 flex items-center justify-center gap-0.5 sm:inset-x-5 sm:gap-1">
              {fallbackBars.map((barIndex) => {
                const base = 0.35 + 0.65 * Math.abs(Math.sin((currentTime + barIndex * 0.17) * 2.3));
                return (
                  <span
                    key={barIndex}
                    className={`${playing ? 'bg-accent/90' : 'bg-white/35'} w-1 rounded-full transition-all duration-200 sm:w-1.5`}
                    style={{ height: `${10 + base * 68}%` }}
                    aria-hidden
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {/* Player container */}
      <div className="relative mt-3 rounded-3xl bg-linear-to-r from-[#1652ff] via-[#1a81ff] to-[#28ebe3] px-4 pb-5 pt-12 sm:mt-4 sm:rounded-4xl sm:px-6 sm:pb-6 sm:pt-16">
        {/* Play/Pause button */}
        <button
          type="button"
          onClick={togglePlay}
          className={
            'touch-manipulation absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ' +
            'border-[4px] border-[#2D2D2D] bg-linear-to-b from-[#30efe6] to-[#1d77ff] text-white shadow-[0_0_28px_rgba(10,228,223,0.55)] transition hover:brightness-110 ' +
            'h-[3.25rem] w-[3.25rem] sm:h-20 sm:w-20 sm:border-[6px]'
          }
          aria-label={playing ? 'Pausar' : 'Reproducir'}
          aria-pressed={playing}
        >
          {playing ? <FiPause className="h-6 w-6 sm:h-8 sm:w-8" /> : <FiPlay className="h-7 w-7 translate-x-0.5 sm:h-[34px] sm:w-[34px]" />}
        </button>

        {/* Player controls */}
        <div className="absolute left-0 right-0 top-2 flex items-center justify-between gap-1 px-2 sm:top-3 sm:gap-2 sm:px-8 md:px-10">
          <button
            type="button"
            onClick={() => seekBy(-10)}
            className="touch-manipulation shrink-0 rounded-full p-1.5 text-white transition hover:bg-white/15 sm:p-2"
            aria-label="Retroceder 10 segundos"
            title="Retroceder 10s"
          >
            <FiSkipBack className="h-6 w-6 sm:h-7 sm:w-7" />
          </button>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-4 tabular-nums text-white/85 sm:gap-10 md:gap-24 lg:gap-32">
            <span className="text-xs sm:text-sm">{formatTime(currentTime)}</span>
            <span className="text-xs sm:text-sm">{formatTime(duration)}</span>
          </div>

          <button
            type="button"
            onClick={() => seekBy(10)}
            className="touch-manipulation shrink-0 rounded-full p-1.5 text-white transition hover:bg-white/15 sm:p-2"
            aria-label="Adelantar 10 segundos"
            title="Adelantar 10s"
          >
            <FiSkipForward className="h-6 w-6 sm:h-7 sm:w-7" />
          </button>
        </div>

        <div className="mt-1 flex items-center gap-3 sm:mt-2 sm:gap-4">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/30 bg-white/10 shadow-inner sm:h-16 sm:w-16 sm:rounded-2xl">
            {cover ? (
              <img src={cover} onError={() => setCover(null)} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl text-white/40 sm:text-2xl">♪</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold leading-tight text-white sm:text-2xl sm:leading-none">{track.title}</p>
            <p className="mt-1 truncate text-sm leading-tight text-white/75 sm:mt-2 sm:text-lg sm:leading-none">{track.artistLabel}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-2 sm:mt-5 sm:gap-3">
          <FiVolume2 className="h-4 w-4 shrink-0 text-white/85 sm:h-5 sm:w-5" aria-hidden />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            className="h-2.5 w-full min-h-[44px] cursor-pointer appearance-none rounded-full bg-white/30 accent-white py-3 sm:min-h-0 sm:py-0"
            aria-label="Volumen"
          />
        </div>
      </div>
    </div>
  );
}

