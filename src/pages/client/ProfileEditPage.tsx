import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '../../components';
import { PageLayout } from '../../layouts';
import { useAuth } from '../../contexts/AuthContext';
import { getClientProfile, updateClientProfile } from '../../api/clientProfileService';
import { uploadFile } from '../../api/storageService';
import { ApiError } from '../../api';
import { getProfilePath } from '../../config';
import { isBackendRoleCliente } from '../../helpers/role';
import {
  getRequiredError,
  getPhoneDigitsError,
  getCountryCodeRequiredError,
} from '../../helpers/validation';

const COUNTRY_CODES = [
  { value: '', label: 'Seleccionar' },
  { value: '34', label: '+34 España' },
  { value: '1', label: '+1 USA/Can' },
  { value: '52', label: '+52 México' },
  { value: '57', label: '+57 Colombia' },
  { value: '54', label: '+54 Argentina' },
  { value: '58', label: '+58 Venezuela' },
  { value: '51', label: '+51 Perú' },
  { value: '56', label: '+56 Chile' },
  { value: '55', label: '+55 Brasil' },
  { value: '593', label: '+593 Ecuador' },
  { value: '49', label: '+49 Alemania' },
  { value: '33', label: '+33 Francia' },
  { value: '39', label: '+39 Italia' },
  { value: '44', label: '+44 Reino Unido' },
];

function parsePhone(phone: string | undefined): { countryCode: string; digits: string } {
  if (!phone || !phone.trim()) return { countryCode: '', digits: '' };
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 0) return { countryCode: '', digits: '' };
  for (const { value } of COUNTRY_CODES.slice(1)) {
    if (value && digits.startsWith(value)) {
      return { countryCode: value, digits: digits.slice(value.length) };
    }
  }
  return { countryCode: '', digits: digits };
}

export function ClientEditScreen() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [roleBlocked, setRoleBlocked] = useState(false);

  const isCliente = isBackendRoleCliente(user?.role);

  useEffect(() => {
    if (!user) return;

    if (!isCliente) {
      setRoleBlocked(true);
      setIsLoading(false);
      setName(user.displayName ?? '');
      return;
    }

    let cancelled = false;
    setInfoMessage('');
    setError('');

    getClientProfile()
      .then((data) => {
        if (cancelled) return;
        setName(data.name ?? user?.displayName ?? '');
        const { countryCode: cc, digits } = parsePhone(data.phone);
        setCountryCode(cc);
        setPhone(digits);
        setLocation(data.location ?? '');
        setPhoto(data.photo ?? null);
        setPhotoPreview(data.photo ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setName(user?.displayName ?? '');
        if (err instanceof ApiError) {
          if (err.status === 404) {
            setInfoMessage('Aún no has completado tu perfil. Puedes hacerlo ahora.');
          } else if (err.status === 403) {
            setInfoMessage('Completa tu perfil a continuación.');
          } else {
            setError(err.message || 'No se pudo cargar el perfil.');
          }
        } else {
          setError(err instanceof Error ? err.message : 'No se pudo cargar el perfil.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.uid, user?.displayName, isCliente]);

  const nameError = getRequiredError(name);
  const phoneDigitsError = getPhoneDigitsError(phone);
  const countryCodeError = getCountryCodeRequiredError(phone, countryCode);

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/\D/g, '');
    setPhone(v);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoFile(null);
      setPhotoPreview(photo);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('[ClientProfile Update] handleSubmit fired');
    setError('');
    setIsSubmitted(true);
    if (nameError || phoneDigitsError || countryCodeError) {
      console.log('[ClientProfile Update] validation failed', {
        nameError,
        phoneDigitsError,
        countryCodeError,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let photoUrl = photo;
      if (photoFile) {
        const { url } = await uploadFile(photoFile);
        photoUrl = url;
      }
      const phoneValue =
        phone.trim() && countryCode.trim()
          ? `${countryCode}${phone.replace(/\D/g, '')}`
          : undefined;
      const payload = {
        name: name.trim(),
        phone: phoneValue,
        location: location.trim() || undefined,
        photo: photoUrl || undefined,
      };
      console.log('[ClientProfile Update] calling updateClientProfile with payload', payload);
      await updateClientProfile(payload);
      console.log('[ClientProfile Update] updateClientProfile succeeded');
      await refreshUser();
      navigate('/client/profile', { replace: true });
    } catch (err) {
      console.log('[ClientProfile Update] submit error', err);
      if (err instanceof ApiError) {
        console.log('[ClientProfile Update] ApiError status', err.status, 'message', err.message);
      }
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'No se pudo guardar. Inténtalo de nuevo.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <PageLayout title="Editar perfil" maxWidth="md" variant="dark">
        <p className="text-neutral-500">Cargando...</p>
      </PageLayout>
    );
  }

  if (roleBlocked) {
    return (
      <PageLayout title="Editar perfil" maxWidth="md" variant="dark">
        <Card variant="dark" title="Perfil de cliente">
          <p className="text-neutral-600 mb-4">
            Tu cuenta no tiene perfil de cliente. Usa la edición básica para actualizar tu nombre y foto.
          </p>
          <Link to="/profile/edit">
            <Button variant="primary">Ir a edición básica</Button>
          </Link>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Editar perfil" maxWidth="md" variant="dark">
      <Card variant="dark" title="Edita tu perfil (cliente)">
        <form onSubmit={handleSubmit} className="space-y-4">
          {infoMessage && (
            <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded" role="status">
              {infoMessage}
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">
              {error}
            </p>
          )}
          {(photoPreview || photoFile) && (
            <div className="flex justify-center">
              <img
                src={photoPreview ?? undefined}
                alt=""
                className="w-24 h-24 rounded-full object-cover"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Foto (opcional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="block w-full text-sm text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-neutral-100 file:font-medium file:text-neutral-900 hover:file:bg-neutral-200"
            />
          </div>
          <Input
            label="Nombre"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={isSubmitted ? nameError : undefined}
            required
          />
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Código de país</label>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className={`w-full px-3 py-2 border rounded bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400 ${isSubmitted && countryCodeError ? 'border-red-500' : 'border-neutral-300'}`}
            >
              {COUNTRY_CODES.map(({ value, label }) => (
                <option key={value || 'empty'} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {isSubmitted && countryCodeError && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {countryCodeError}
              </p>
            )}
          </div>
          <Input
            label="Teléfono móvil"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={handlePhoneChange}
            error={isSubmitted ? phoneDigitsError : undefined}
            placeholder="Solo dígitos"
          />
          <Input
            label="Ubicación"
            type="text"
            autoComplete="address-level1"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(getProfilePath(user?.role))}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </PageLayout>
  );
}
