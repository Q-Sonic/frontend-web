/** File size limits for artist media (match backend). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;   // 5 MB
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;  // 10 MB
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;  // 50 MB

export const MAX_IMAGE_LABEL = '5 MB';
export const MAX_AUDIO_LABEL = '10 MB';
export const MAX_VIDEO_LABEL = '50 MB';

export const ACCEPT_IMAGE = 'image/jpeg,image/png,image/webp,image/gif';
export const ACCEPT_AUDIO = 'audio/mpeg,audio/mp3,audio/wav,audio/webm,audio/ogg';
export const ACCEPT_VIDEO = 'video/mp4,video/webm,video/quicktime';

export type MediaTypeOption = 'image' | 'audio' | 'video';

export const MEDIA_TYPE_OPTIONS: { value: MediaTypeOption; label: string; accept: string; maxBytes: number; maxLabel: string }[] = [
  { value: 'image', label: 'Imagen', accept: ACCEPT_IMAGE, maxBytes: MAX_IMAGE_BYTES, maxLabel: MAX_IMAGE_LABEL },
  { value: 'audio', label: 'Audio', accept: ACCEPT_AUDIO, maxBytes: MAX_AUDIO_BYTES, maxLabel: MAX_AUDIO_LABEL },
  { value: 'video', label: 'Video', accept: ACCEPT_VIDEO, maxBytes: MAX_VIDEO_BYTES, maxLabel: MAX_VIDEO_LABEL },
];
