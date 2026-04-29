import { useEffect, useMemo, useState } from 'react';
import { FiCamera, FiX } from 'react-icons/fi';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#00d4c8]/35 bg-[#111214] p-6 shadow-[0_0_40px_rgba(0,212,200,0.2)] ${subtleScrollbarClass}`}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-3xl text-white">Editando perfil</p>
            <h3 className="text-5xl font-semibold text-white">Configuración de perfil</h3>
            <p className="mt-1 text-xl text-white/70">Foto, informacion y redes</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 px-3 py-1 text-white/70 transition hover:text-white"
            disabled={isSaving}
          >
            <FiX />
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="rounded-2xl border border-[#00d4c8]/35 p-5">
          <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
            <div className="space-y-3">
              <label className="block text-xl text-white">Nombre de Artista</label>
              <input
                value={artistNameDraft}
                onChange={(e) => setArtistNameDraft(e.target.value)}
                className="w-full rounded-lg border border-white/30 bg-transparent px-3 py-2 text-white"
              />
              <label className="block text-xl text-white">Descripcion del Artista</label>
              <textarea
                rows={5}
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                className="w-full rounded-lg border border-white/30 bg-transparent px-3 py-2 text-white"
              />
              <label className="block text-xl text-white">Ciudad</label>
              <input
                value={cityDraft}
                onChange={(e) => setCityDraft(e.target.value)}
                className="w-full rounded-lg border border-white/30 bg-transparent px-3 py-2 text-white"
              />
            </div>

            <div className="flex flex-col items-center justify-center gap-4">
              <div className="aspect-video w-full max-w-[280px] overflow-hidden rounded-2xl border border-[#00d4c8]/55 bg-black/30">
                {displayPhoto && <img src={displayPhoto} alt="Foto de artista" className="h-full w-full object-cover" />}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#00d4c8]/60 bg-[#00d4c8]/25 px-4 py-2 text-lg text-white">
                <FiCamera />
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
          </div>

          {/* <div className="mt-5 space-y-2">
            <label className="block text-2xl text-white">Redes Sociales</label>
            <input
              value={socialDraft.youtube}
              onChange={(e) => setSocialDraft((prev) => ({ ...prev, youtube: e.target.value }))}
              placeholder="https://www.youtube.com/..."
              className="w-full rounded-lg border border-white/30 bg-transparent px-3 py-2 text-white"
            />
            <input
              value={socialDraft.facebook}
              onChange={(e) => setSocialDraft((prev) => ({ ...prev, facebook: e.target.value }))}
              placeholder="https://www.facebook.com/..."
              className="w-full rounded-lg border border-white/30 bg-transparent px-3 py-2 text-white"
            />
            <input
              value={socialDraft.instagram}
              onChange={(e) => setSocialDraft((prev) => ({ ...prev, instagram: e.target.value }))}
              placeholder="https://www.instagram.com/..."
              className="w-full rounded-lg border border-white/30 bg-transparent px-3 py-2 text-white"
            />
            <input
              value={socialDraft.tiktok}
              onChange={(e) => setSocialDraft((prev) => ({ ...prev, tiktok: e.target.value }))}
              placeholder="https://www.tiktok.com/..."
              className="w-full rounded-lg border border-white/30 bg-transparent px-3 py-2 text-white"
            />
          </div> */}
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={saveProfile} loading={isSaving}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
