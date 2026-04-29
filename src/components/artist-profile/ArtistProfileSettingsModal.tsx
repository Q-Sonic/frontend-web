import { useEffect, useMemo, useState } from 'react';
import { FiCamera, FiGlobe, FiMapPin, FiType, FiUser, FiX } from 'react-icons/fi';
import { Button } from '../Button';
import { updateArtistProfileWithFormData, updateUser } from '../../api';
import type { ArtistProfile, ArtistProfileUpdate } from '../../types';

type ArtistProfileSettingsModalProps = {
  isOpen: boolean;
  profile: (ArtistProfile & { uid: string }) | null;
  artistDisplayName: string;
  onClose: () => void;
  onSaved: (profile: ArtistProfile) => void;
  onArtistNameSaved: (nextName: string) => void;
};

function normalizeSocialUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function ArtistProfileSettingsModal({
  isOpen,
  profile,
  artistDisplayName,
  onClose,
  onSaved,
  onArtistNameSaved,
}: ArtistProfileSettingsModalProps) {
  const [artistNameDraft, setArtistNameDraft] = useState('');
  const [cityDraft, setCityDraft] = useState('');
  const [bioDraft, setBioDraft] = useState('');
  const [socialDraft, setSocialDraft] = useState({
    instagram: '',
    facebook: '',
    youtube: '',
    tiktok: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !profile) return;
    setArtistNameDraft(artistDisplayName);
    setCityDraft(profile.city ?? '');
    setBioDraft(profile.biography ?? '');
    setSocialDraft({
      instagram: profile.socialNetworks?.instagram ?? '',
      facebook: profile.socialNetworks?.facebook ?? '',
      youtube: profile.socialNetworks?.youtube ?? '',
      tiktok: profile.socialNetworks?.tiktok ?? '',
    });
    setPhotoFile(null);
    setPreviewUrl('');
    setError('');
  }, [isOpen, profile, artistDisplayName]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const displayPhoto = useMemo(() => {
    if (previewUrl) return previewUrl;
    return profile?.photo ?? '';
  }, [previewUrl, profile?.photo]);

  if (!isOpen || !profile) return null;

  const subtleScrollbarClass =
    'scrollbar-thin [scrollbar-color:rgba(255,255,255,0.20)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-white/30';

  const saveProfile = async () => {
    setIsSaving(true);
    setError('');
    try {
      const basePayload: ArtistProfileUpdate = {
        biography: bioDraft.trim(),
        city: cityDraft.trim(),
        socialNetworks: {
          instagram: normalizeSocialUrl(socialDraft.instagram),
          facebook: normalizeSocialUrl(socialDraft.facebook),
          youtube: normalizeSocialUrl(socialDraft.youtube),
          tiktok: normalizeSocialUrl(socialDraft.tiktok),
        },
        media: profile.media ?? [],
        blockedDates: profile.blockedDates ?? [],
        featuredSong: profile.featuredSong,
        photo: profile.photo ?? '',
      };

      const formData = new FormData();
      formData.append('biography', basePayload.biography ?? '');
      formData.append('city', basePayload.city ?? '');
      formData.append('instagram', basePayload.socialNetworks?.instagram ?? '');
      formData.append('facebook', basePayload.socialNetworks?.facebook ?? '');
      formData.append('youtube', basePayload.socialNetworks?.youtube ?? '');
      formData.append('tiktok', basePayload.socialNetworks?.tiktok ?? '');
      if (photoFile) {
        formData.append('photo', photoFile);
      }
      const savedProfile: ArtistProfile = await updateArtistProfileWithFormData(formData);
      const normalizedArtistName = artistNameDraft.trim();
      if (normalizedArtistName && normalizedArtistName !== artistDisplayName) {
        await updateUser(profile.uid, { displayName: normalizedArtistName });
        onArtistNameSaved(normalizedArtistName);
      }
      onSaved(savedProfile);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div
        className={`w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#00d4c8]/25 bg-[#0f1115] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)] sm:p-7 ${subtleScrollbarClass}`}
      >
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#00d4c8]/30 bg-[#00d4c8]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#71fff4]">
              <FiUser className="text-sm" aria-hidden />
              Editando perfil
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Configuración de perfil
            </h3>
            <p className="mt-1 text-sm text-neutral-400 sm:text-base">Foto, información y redes sociales.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-white/30 hover:bg-white/5 hover:text-white"
            disabled={isSaving}
          >
            <FiX size={18} />
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
              <div>
                <p className="mb-1 text-sm font-semibold text-white">Información principal</p>
                <p className="text-xs text-neutral-500">Estos datos se muestran en tu perfil público.</p>
              </div>

              <label className="block space-y-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-neutral-200">
                  <FiType className="text-[#00d4c8]" aria-hidden />
                  Nombre de artista
                </span>
                <input
                  value={artistNameDraft}
                  onChange={(e) => setArtistNameDraft(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/20 bg-black/35 px-3.5 text-sm text-white outline-none transition focus:border-[#00d4c8]/60 focus:ring-2 focus:ring-[#00d4c8]/25"
                />
              </label>

              <label className="block space-y-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-neutral-200">
                  <FiUser className="text-[#00d4c8]" aria-hidden />
                  Descripción del artista
                </span>
                <textarea
                  rows={5}
                  value={bioDraft}
                  onChange={(e) => setBioDraft(e.target.value)}
                  className="min-h-[132px] w-full resize-y rounded-xl border border-white/20 bg-black/35 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-[#00d4c8]/60 focus:ring-2 focus:ring-[#00d4c8]/25"
                />
              </label>

              <label className="block space-y-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-neutral-200">
                  <FiMapPin className="text-[#00d4c8]" aria-hidden />
                  Ciudad
                </span>
                <input
                  value={cityDraft}
                  onChange={(e) => setCityDraft(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/20 bg-black/35 px-3.5 text-sm text-white outline-none transition focus:border-[#00d4c8]/60 focus:ring-2 focus:ring-[#00d4c8]/25"
                />
              </label>
            </div>

            <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
              <div className="flex flex-col items-center gap-4">
                <div className="aspect-video w-full overflow-hidden rounded-2xl border border-[#00d4c8]/40 bg-black/35 shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
                  {displayPhoto ? (
                    <img src={displayPhoto} alt="Foto de artista" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-neutral-500">Sin imagen</div>
                  )}
                </div>
                <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-[#00d4c8]/55 bg-[#00d4c8]/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#00d4c8]/25">
                  <FiCamera className="text-base" />
                  Cambiar foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setPhotoFile(file);
                      if (!file) {
                        setPreviewUrl('');
                        return;
                      }
                      setPreviewUrl(URL.createObjectURL(file));
                    }}
                  />
                </label>
              </div>

              {/* <div className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-3.5">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                  <FiGlobe className="text-[#00d4c8]" aria-hidden />
                  Redes sociales
                </p>
                <input
                  value={socialDraft.youtube}
                  onChange={(e) => setSocialDraft((prev) => ({ ...prev, youtube: e.target.value }))}
                  placeholder="YouTube"
                  className="h-10 w-full rounded-lg border border-white/20 bg-black/35 px-3 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-[#00d4c8]/60"
                />
                <input
                  value={socialDraft.facebook}
                  onChange={(e) => setSocialDraft((prev) => ({ ...prev, facebook: e.target.value }))}
                  placeholder="Facebook"
                  className="h-10 w-full rounded-lg border border-white/20 bg-black/35 px-3 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-[#00d4c8]/60"
                />
                <input
                  value={socialDraft.instagram}
                  onChange={(e) => setSocialDraft((prev) => ({ ...prev, instagram: e.target.value }))}
                  placeholder="Instagram"
                  className="h-10 w-full rounded-lg border border-white/20 bg-black/35 px-3 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-[#00d4c8]/60"
                />
                <input
                  value={socialDraft.tiktok}
                  onChange={(e) => setSocialDraft((prev) => ({ ...prev, tiktok: e.target.value }))}
                  placeholder="TikTok"
                  className="h-10 w-full rounded-lg border border-white/20 bg-black/35 px-3 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-[#00d4c8]/60"
                />
              </div> */}
            </div>
          </div>
        </div>
        {/* legacy form kept below intentionally removed in redesign */}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving} className="min-h-[44px] rounded-full">
            Cancelar
          </Button>
          <Button onClick={saveProfile} loading={isSaving} className="min-h-[44px] rounded-full px-6">
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
