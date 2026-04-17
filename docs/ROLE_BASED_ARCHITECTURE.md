# Role-Based Architecture — Documentation 🏗️

## Overview

The Q-Music platform implements a strict, role-based navigation and layout system. Every authenticated user experience is centralized through a shared shell, ensuring consistency and security across all account types.

### Post-Login Flow
- **Login** → **Register** (public).
- After login, users are automatically redirected to their role-specific dashboard:
  - `cliente` → `/client`
  - `artista` → `/artist`
  - `admin` → `/admin`
  - `organizacion` → `/organization`
- Each role has its dedicated **Home**, **Profile**, and **Profile Edit** screens.

---

## 1. Architecture Implementation Status ✅

| Area | Implementation Details | Status |
|------|------------------------|--------|
| **Auth Flow** | Login/Register with `AuthContext` (tokens in localStorage, `user` state). | ✅ Complete |
| **Shell Layout** | `AuthenticatedLayout` (Topbar + UserMenu) wraps all protected routes. | ✅ Complete |
| **Route Protection** | `ProtectedRoute` (Auth check) and `PublicOnlyRoute` (Guest check). | ✅ Complete |
| **Role-Based Routing** | Centralized redirection via `HomeRedirectPage` and `ProfileRedirectPage`. | ✅ Complete |
| **Role Helpers** | `src/helpers/role.ts` provides `ROLE_ROUTES`, normalization, and role checks. | ✅ Complete |
| **Clean Paths** | Routes like `/admin`, `/artist`, `/client` instead of messy `/home/role`. | ✅ Complete |

---

## 2. Core Components

### `src/layouts/AuthenticatedLayout.tsx`
The primary "Shell" for the application. It provides:
- **Global Topbar**: App branding and site-wide navigation.
- **UserMenu**: Quick access to Profile and Logout functionality.
- **Outlet**: Renders the specific page content based on the route.

### `src/helpers/role.ts`
The single source of truth for role logic:
- `ROLE_ROUTES`: Mapping of internal roles to URL segments.
- `getProfileEditRoute(role)`: Normalizes backend roles for frontend routing.
- `isBackendRoleOrganizacion`, `isBackendRoleAdmin`, etc.

---

## 3. Directory Structure (Current) 📂

```
src/
├── layouts/
│   ├── AuthenticatedLayout.tsx    # Shared Topbar + UserMenu
│   └── SidebarLayout.tsx          # Nested layout for sidebars (Artist/Client)
│
├── helpers/
│   └── role.ts                    # Role normalization and route constants
│
├── pages/
│   ├── home/                      # All Dashboards (Redirect, Admin, Org, Client, Artist)
│   ├── profile/                   # All Profile Views (Redirect, Admin, Org, Client, Artist)
│   ├── profileEdit/               # All Edit Screens (Admin, Org, Client, Artist)
│   ├── account/                   # Legacy/Generic fallback pages
│   ├── artist/                    # Artist-specific sub-pages
│   └── client/                    # Client-specific sub-pages
│
└── routes/
    └── AppRoutes.tsx              # Centralized routing with nested layouts
```

---

## 4. Scalability Note 🚀

To add a new role (e.g., `soporte`):
1.  Add the role to `src/helpers/role.ts` (mapping it to a route segment).
2.  Create the specific pages in `src/pages/home`, `src/pages/profile`, and `src/pages/profileEdit`.
3.  Register the routes in `src/routes/AppRoutes.tsx` inside the `AuthenticatedLayout` group.
4.  The system will automatically handle the redirection and layout injection.

---
**Status: Modernization Phase 1 [COMPLETED]**
*Last Update: 2026-04-10*
