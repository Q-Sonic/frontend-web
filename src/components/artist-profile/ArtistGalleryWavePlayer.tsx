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
          height: 54,
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
  }, [cleanupAll, track?.streamUrl, volume]);

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
      <div className="w-full max-w-[500px] rounded-3xl border border-white/10 bg-white/4 px-4 py-6 text-center">
        <p className="text-xs text-neutral-400 leading-relaxed">
          Este artista aún no tiene canciones publicadas en el perfil.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[520px] relative pt-20">
      {/* Waveform container */}
      <div className="absolute inset-0 overflow-hidden rounded-4xl bg-[#2D2D2D] px-6 py-2 w-[90%] mx-auto">
        <div className="flex items-center justify-between">
          <div ref={waveContainerRef} className="w-[60%] mx-auto" aria-label="Forma de onda de audio" />
          {!waveformReady ? (
            <div className="w-full h-10 mx-auto flex items-center justify-center gap-1.5">
              {fallbackBars.map((barIndex) => {
                const base = 0.35 + 0.65 * Math.abs(Math.sin((currentTime + barIndex * 0.17) * 2.3));
                return (
                  <span
                    key={barIndex}
                    className={`${playing ? 'bg-accent/90' : 'bg-white/35'} w-1.5 rounded-full transition-all duration-200`}
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
      <div className="relative mt-4 rounded-4xl bg-linear-to-r from-[#1652ff] via-[#1a81ff] to-[#28ebe3] px-6 pb-6 pt-16">
        {/* Play/Pause button */}
        <button
          type="button"
          onClick={togglePlay}
          className="absolute left-1/2 top-0 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[6px] border-[#2D2D2D] bg-linear-to-b from-[#30efe6] to-[#1d77ff] text-white shadow-[0_0_32px_rgba(10,228,223,0.55)] transition hover:brightness-110"
          aria-label={playing ? 'Pausar' : 'Reproducir'}
          aria-pressed={playing}
        >
          {playing ? <FiPause size={32} /> : <FiPlay size={34} className="translate-x-0.5" />}
        </button>

        {/* Player controls */}
        <div className="absolute top-3 left-0 right-0 px-10 mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => seekBy(-10)}
            className="rounded-full p-2 text-white transition hover:bg-white/15"
            aria-label="Retroceder 10 segundos"
            title="Retroceder 10s"
          >
            <FiSkipBack size={28} />
          </button>

          <div className="flex items-center justify-between gap-32">
            <span className="text-white/85">{formatTime(currentTime)}</span>

            <span className="text-white/85">{formatTime(duration)}</span>
          </div>

          <button
            type="button"
            onClick={() => seekBy(10)}
            className="rounded-full p-2 text-white transition hover:bg-white/15"
            aria-label="Adelantar 10 segundos"
            title="Adelantar 10s"
          >
            <FiSkipForward size={28} />
          </button>
        </div>

        <div className="mt-2 flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/30 bg-white/10 shadow-inner">
            {cover ? (
              <img src={cover} onError={() => setCover(null)} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl text-white/40">♪</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-2xl font-semibold leading-none text-white">{track.title}</p>
            <p className="mt-2 truncate text-lg leading-none text-white/75">{track.artistLabel}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[auto_1fr] items-center gap-3">
          <FiVolume2 className="h-5 w-5 text-white/85" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/30 accent-white"
            aria-label="Volumen"
          />
        </div>
      </div>
    </div>
  );
}

