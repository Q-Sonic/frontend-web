import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, UserMenu } from '../../components';
import { getAllUsers } from '../../api';
import type { UserRecord } from '../../types';

const ROLES: Record<string, string> = {
  cliente: 'Cliente',
  artista: 'Artista',
  admin: 'Admin',
  organizacion: 'Organización',
  soporte: 'Soporte',
};

export function HomeAdminPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');

  useEffect(() => {
    let cancelled = false;
    getAllUsers()
      .then((list) => {
        if (!cancelled) setUsers(list);
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filtered = filterRole
    ? users.filter((u) => (u.role ?? '').toLowerCase() === filterRole.toLowerCase())
    : users;

  const byRole = filtered.reduce((acc, u) => {
    const r = (u.role ?? 'basico').toLowerCase();
    if (!acc[r]) acc[r] = [];
    acc[r].push(u);
    return acc;
  }, {} as Record<string, UserRecord[]>);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full">
      <div className="flex justify-end mb-4">
        <UserMenu />
      </div>
      <section className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Inicio (Admin)</h1>
          <p className="text-neutral-400 mt-1">Gestión general de usuarios y plataforma</p>
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
        >
          <option value="">Todos los roles</option>
          {Object.entries(ROLES).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </section>

      {loading ? (
        <p className="text-neutral-500">Cargando usuarios...</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(ROLES).map(([roleKey, roleLabel]) => {
            const list = byRole[roleKey];
            if (!list || list.length === 0) return null;
            return (
              <Card key={roleKey} variant="dark" title={`${roleLabel} (${list.length})`}>
                <ul className="divide-y divide-neutral-700">
                  {list.map((u) => (
                    <li key={u.uid} className="py-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-medium text-white">{u.displayName || u.email || u.uid}</span>
                        <span className="text-neutral-500 text-sm ml-2">{u.email}</span>
                      </div>
                      <span className="text-neutral-400 text-sm">{u.uid.slice(0, 8)}…</span>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-neutral-500">No hay usuarios que coincidan.</p>
          )}
        </div>
      )}

      <div className="mt-8 flex gap-4">
        <Link to="/admin/create-artist">
          <Button variant="primary">Crear artista</Button>
        </Link>
      </div>
    </div>
  );
}
