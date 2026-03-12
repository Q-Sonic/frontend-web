import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BackButton, Button, Card, PageLayout } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import {
  getMyArtistServices,
  createArtistService,
  updateArtistService,
  deleteArtistService,
} from '../../services';
import type { ArtistServiceRecord, CreateArtistServiceBody } from '../../types';
import { ApiError } from '../../utils';
import { isBackendRoleArtista } from '../../utils/role';
import { getRequiredError } from '../../utils/validation';

const SERVICE_NAME_SUGGESTIONS = ['Concierto', 'Acústico', 'Evento privado'];

export function ArtistServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<ArtistServiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleBlocked, setRoleBlocked] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isArtista = isBackendRoleArtista(user?.role);

  function loadServices() {
    if (!user?.uid || !isArtista) return;
    setError('');
    getMyArtistServices()
      .then(setServices)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los servicios.');
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    if (!user) return;
    if (!isArtista) {
      setRoleBlocked(true);
      setIsLoading(false);
      return;
    }
    loadServices();
  }, [user?.uid, isArtista]);

  const nameError = getRequiredError(name);
  const priceValue = price.trim();
  const priceNum = priceValue === '' ? NaN : Number(priceValue);
  const priceError =
    priceValue === ''
      ? 'Este campo es obligatorio'
      : Number.isNaN(priceNum) || priceNum < 0
        ? 'Introduce un precio válido (número mayor o igual a 0)'
        : undefined;

  const isFormValid = !nameError && !priceError;

  function openCreate() {
    setEditingId(null);
    setName('');
    setPrice('');
    setDescription('');
    setShowForm(true);
    setSubmitError('');
    setIsSubmitted(false);
  }

  function openEdit(service: ArtistServiceRecord) {
    setEditingId(service.id);
    setName(service.name);
    setPrice(String(service.price));
    setDescription(service.description ?? '');
    setShowForm(true);
    setSubmitError('');
    setIsSubmitted(false);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setSubmitError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitted(true);
    if (!isFormValid || !user?.uid) return;

    setIsSubmitting(true);
    try {
      const body: CreateArtistServiceBody = {
        name: name.trim(),
        price: priceNum,
        description: description.trim() || undefined,
      };
      if (editingId) {
        await updateArtistService(editingId, body);
      } else {
        await createArtistService(body);
      }
      closeForm();
      loadServices();
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : 'No se pudo guardar. Inténtalo de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar este servicio?')) return;
    try {
      await deleteArtistService(id);
      loadServices();
      if (editingId === id) closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar.');
    }
  }

  if (!user) return null;

  if (roleBlocked) {
    return (
      <PageLayout title="Servicios" maxWidth="md" variant="dark" topContent={<BackButton className="text-neutral-400 hover:text-white" />}>
        <Card variant="dark" title="Servicios del artista">
          <p className="text-neutral-600 mb-4">
            Solo los artistas pueden configurar servicios y precios.
          </p>
          <Link to="/home">
            <Button variant="primary">Volver al inicio</Button>
          </Link>
        </Card>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout title="Servicios" maxWidth="md" variant="dark">
        <p className="text-neutral-500">Cargando...</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Configuración de precios" maxWidth="md" variant="dark" topContent={<BackButton className="text-neutral-400 hover:text-white" />}>
      <Card variant="dark" title="Mis servicios">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded mb-4" role="alert">
            {error}
          </p>
        )}
        <p className="text-neutral-600 text-sm mb-4">
          Configura tipos de espectáculo con nombre, precio y descripción (ej. concierto, acústico,
          evento privado).
        </p>

        {!showForm ? (
          <>
            <div className="space-y-3 mb-4">
              {services.length === 0 ? (
                <p className="text-neutral-500 text-sm">Aún no tienes servicios. Crea el primero.</p>
              ) : (
                services.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-start justify-between gap-2 p-3 border border-neutral-200 rounded-lg bg-neutral-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-neutral-900">{s.name}</p>
                      <p className="text-sm text-neutral-600">
                        {typeof s.price === 'number' ? `$${s.price}` : s.price}
                      </p>
                      {s.description && (
                        <p className="text-sm text-neutral-500 mt-1">{s.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="secondary" type="button" onClick={() => openEdit(s)}>
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => handleDelete(s.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Button type="button" onClick={openCreate}>
              Añadir servicio
            </Button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">
                {submitError}
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre</label>
              <input
                type="text"
                list="service-names"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. Concierto, Acústico, Evento privado"
                className="w-full px-3 py-2 border border-neutral-300 rounded bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                aria-invalid={!!nameError}
              />
              <datalist id="service-names">
                {SERVICE_NAME_SUGGESTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              {isSubmitted && nameError && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {nameError}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Precio</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-neutral-300 rounded bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                aria-invalid={!!priceError}
              />
              {isSubmitted && priceError && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {priceError}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Descripción (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe el tipo de espectáculo"
                className="w-full px-3 py-2 border border-neutral-300 rounded bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
              </Button>
              <Button type="button" variant="secondary" onClick={closeForm}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </Card>
    </PageLayout>
  );
}
