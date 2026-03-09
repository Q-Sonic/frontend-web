# Role-Based Architecture — Implementation Plan

## Desired behavior

- **Login** → **Register** (public).
- After login, redirect by role:
  - `cliente` → `/home/cliente`
  - `artista` → `/home/artista`
  - `admin` → `/home/admin`
  - `organizacion` → `/home/organizacion`
- Each role has: **Home**, **Profile**, **Edit Profile**.
- All authenticated pages share: **Topbar**, **User menu**, **Profile access**, **Logout**.

---

## 1. What already supports this architecture

| Area | Current support |
|------|-----------------|
| **Auth flow** | Login/Register; tokens in localStorage; `AuthContext` with `user`, `logout`, `refreshUser`. |
| **Route protection** | `ProtectedRoute` (redirect to `/login`), `PublicOnlyRoute` (redirect to `/profile`). |
| **Role-based redirect** | `HomeRedirectPage`, `ProfileRedirectPage`, `EditProfilePage` use `getProfileEditRoute(role)` and redirect to `/{area}/{route}`. |
| **Role utils** | `src/utils/role.ts`: `getProfileEditRoute`, `isBackendRoleCliente`, `isBackendRoleArtista` (only cliente/artista/basico). |
| **Layout (partial)** | **Home** pages use Topbar + UserMenu. **Profile** and **Edit Profile** use only `PageLayout` (no Topbar/UserMenu). |
| **Per-role pages** | Home: cliente, artista, basico. Profile: cliente, artista, basico. Edit: ClientEditScreen, ArtistEditScreen, BasicEditScreen. |
| **User menu** | Topbar + UserMenu with Profile link and Logout. |
| **Routes** | `/home`, `/home/:role`, `/profile`, `/profile/:role`, `/profile/edit`, `/profile/edit/:role` for current roles. |

**Gaps:**

- Roles `admin` and `organizacion` are not in `role.ts` or in any redirect/page.
- No single **AuthenticatedLayout** (Topbar + UserMenu) wrapping all authenticated pages; Profile and Edit don’t show Topbar/UserMenu.
- No Home/Profile/Edit pages for `admin` or `organizacion`.

---

## 2. Files to modify

| File | Changes |
|------|--------|
| **`src/utils/role.ts`** | Add `admin` and `organizacion` to the role type and to `getProfileEditRoute`. Add `isBackendRoleAdmin` and `isBackendRoleOrganizacion` if backend has specific endpoints. Export a constant list of role segments (e.g. `ROLE_ROUTES`) for routing. |
| **`src/pages/home/HomeRedirectPage.tsx`** | No logic change if `getProfileEditRoute` already returns `admin` / `organizacion`; redirect stays `/home/${route}`. |
| **`src/pages/profile/ProfileRedirectPage.tsx`** | Same; redirect stays `profile/${route}`. |
| **`src/pages/EditProfilePage.tsx`** | Same; redirect stays `profile/edit/${route}`. |
| **`src/App.tsx`** | Wrap all protected routes (home, profile, profile/edit) with a shared layout that includes Topbar + UserMenu (see “New files” below). Register routes for `admin` and `organizacion` (home, profile, edit). |
| **`src/pages/home/HomeClientePage.tsx`** (and other Home/Profile/Edit pages) | Use the new **AuthenticatedLayout** instead of duplicating Topbar + UserMenu or using only PageLayout. Content stays; only the wrapper changes. |
| **`src/pages/profile/ProfileClientePage.tsx`** (and other profile pages) | Wrap content with **AuthenticatedLayout**; keep inner content (Card, etc.). |
| **`src/pages/profileEdit/ClientEditScreen.tsx`** (and other edit screens) | Same: use **AuthenticatedLayout** as outer wrapper. |
| **`src/components/index.ts`** | Export `AuthenticatedLayout` if it lives under `components`. |
| **`src/pages/index.ts`** | Export new pages: `HomeAdminPage`, `HomeOrganizacionPage`, `ProfileAdminPage`, `ProfileOrganizacionPage`, `AdminEditScreen`, `OrganizacionEditScreen` (or shared “basic” edit for admin/org if no specific fields). |
| **`src/pages/home/index.ts`** | Export `HomeAdminPage`, `HomeOrganizacionPage`. |
| **`src/pages/profile/index.ts`** | Export `ProfileAdminPage`, `ProfileOrganizacionPage`. |
| **`src/pages/profileEdit/index.ts`** | Export `AdminEditScreen`, `OrganizacionEditScreen` (or re-export basic edit for both). |

Optional: **`src/pages/LoginPage.tsx`** — redirect after login can stay to `/home` so `HomeRedirectPage` does the role-based redirect; no change required unless you want to redirect directly to `/home/cliente` etc. from login.

---

## 3. New files to create

| File | Purpose |
|------|--------|
| **`src/layouts/AuthenticatedLayout.tsx`** | Layout used by every protected page: Topbar (with app name) + UserMenu (profile + logout). Renders `children` or `<Outlet />` for the page content. Single place for “Topbar + User menu + Profile access + Logout”. |
| **`src/layouts/index.ts`** | Export `AuthenticatedLayout`. |
| **`src/pages/home/HomeAdminPage.tsx`** | Home for role `admin`. Same structure as HomeClientePage but title “Inicio (Admin)”. |
| **`src/pages/home/HomeOrganizacionPage.tsx`** | Home for role `organizacion`. Same structure, title “Inicio (Organización)”. |
| **`src/pages/profile/ProfileAdminPage.tsx`** | Profile view for admin. Can mirror `ProfileBasicoPage` (user email, displayName, role, photo) until you have an admin-specific API. |
| **`src/pages/profile/ProfileOrganizacionPage.tsx`** | Profile view for organizacion. Same as above until you have organizacion-specific profile API. |
| **`src/pages/profileEdit/AdminEditScreen.tsx`** | Edit profile for admin. Can mirror `BasicEditScreen` (displayName, photo) until backend has admin profile. |
| **`src/pages/profileEdit/OrganizacionEditScreen.tsx`** | Edit profile for organizacion. Same as above. |

If you later add backend endpoints for admin/organizacion profiles, add:

- `src/services/adminProfileService.ts` (optional)
- `src/services/organizacionProfileService.ts` (optional)
- `src/types/profile.ts` — extend with `AdminProfile`, `OrganizacionProfile` if needed.

---

## 4. Suggested folder structure (scalable)

```
src/
├── main.tsx
├── App.tsx
├── style.css
│
├── contexts/
│   └── AuthContext.tsx
│
├── layouts/
│   ├── index.ts
│   └── AuthenticatedLayout.tsx    # Topbar + UserMenu + outlet
│
├── components/
│   ├── index.ts
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── PageLayout.tsx             # Optional: used inside AuthenticatedLayout for centered content
│   ├── ProtectedRoute.tsx
│   ├── PublicOnlyRoute.tsx
│   ├── Topbar.tsx
│   └── UserMenu.tsx
│
├── pages/
│   ├── index.ts
│   │
│   ├── auth/                       # Public (no layout)
│   │   ├── index.ts
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   │
│   ├── home/                       # All use AuthenticatedLayout
│   │   ├── index.ts
│   │   ├── HomeRedirectPage.tsx
│   │   ├── HomeClientePage.tsx
│   │   ├── HomeArtistaPage.tsx
│   │   ├── HomeAdminPage.tsx
│   │   ├── HomeOrganizacionPage.tsx
│   │   └── HomeBasicoPage.tsx      # Fallback for unknown role
│   │
│   ├── profile/
│   │   ├── index.ts
│   │   ├── ProfileRedirectPage.tsx
│   │   ├── ProfileClientePage.tsx
│   │   ├── ProfileArtistaPage.tsx
│   │   ├── ProfileAdminPage.tsx
│   │   ├── ProfileOrganizacionPage.tsx
│   │   └── ProfileBasicoPage.tsx
│   │
│   └── profileEdit/
│       ├── index.ts
│       ├── ClientEditScreen.tsx
│       ├── ArtistEditScreen.tsx
│       ├── AdminEditScreen.tsx
│       ├── OrganizacionEditScreen.tsx
│       └── BasicEditScreen.tsx
│
├── services/
│   └── ...
│
├── types/
│   └── ...
│
└── utils/
    ├── role.ts                    # Single source of truth for role routes
    └── ...
```

**Routing in App.tsx (concept):**

- Public: `/login`, `/register` — no layout.
- Protected: wrap in a parent route with `element={<AuthenticatedLayout />}` and nested routes for `/home`, `/home/cliente`, …, `/profile`, `/profile/cliente`, …, `/profile/edit`, `/profile/edit/cliente`, … so every authenticated page automatically gets Topbar + UserMenu.

**Role source of truth in `utils/role.ts`:**

- Define `RoleRoute = 'cliente' | 'artista' | 'admin' | 'organizacion' | 'basico'`.
- `getProfileEditRoute(role)` returns the segment for that role (admin → `'admin'`, organizacion → `'organizacion'`, unknown → `'basico'`).
- Optionally export `ROLE_ROUTES: RoleRoute[]` for generating routes or nav.

This keeps:

- One place for “authenticated shell” (AuthenticatedLayout).
- One place for role → route mapping (role.ts).
- Consistent naming: one Home/Profile/Edit page per role, easy to add new roles later.

---

## 5. Implementation order

1. **`src/utils/role.ts`** — Add `admin` and `organizacion`; extend `getProfileEditRoute` and types.
2. **`src/layouts/AuthenticatedLayout.tsx`** + **`layouts/index.ts`** — Topbar + UserMenu + children/Outlet.
3. **App.tsx** — Use a layout route so all protected routes render inside `AuthenticatedLayout`; add routes for `/home/admin`, `/home/organizacion`, `/profile/admin`, `/profile/organizacion`, `/profile/edit/admin`, `/profile/edit/organizacion`.
4. **New pages** — Add HomeAdminPage, HomeOrganizacionPage, ProfileAdminPage, ProfileOrganizacionPage, AdminEditScreen, OrganizacionEditScreen (each can start as a copy of the “basico” variant).
5. **Refactor existing pages** — Replace inline Topbar+UserMenu or bare PageLayout with `AuthenticatedLayout` (and keep PageLayout only for the inner content where needed).
6. **Exports** — Update `pages/index.ts` and each `pages/*/index.ts` for the new components.

After this, login → redirect by role and all authenticated pages (Home, Profile, Edit Profile) will share the same layout with Topbar, User menu, Profile access, and Logout.
