import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute, AdminOnlyRoute } from '../components';
import { AppLayout, SidebarLayout } from '../layouts';
import { artistSidebarMenus } from '../constants/menus';
import { useAuth } from '../contexts/AuthContext';
import { isBackendRoleArtista } from '../helpers/role';
import {
  LandingPage,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  EditProfilePage,
  ClientEditScreen,
  ArtistEditScreen,
  HomeRedirectPage,
  HomeClientePage,
  HomeArtistaPage,
  HomeAdminPage,
  HomeOrganizacionPage,
  ProfileRedirectPage,
  ProfileClientePage,
  ArtistServicesPage,
  ArtistMediaPage,
  ArtistViewPage,
  ArtistCalendarPage,
  CreateArtistPage,
} from '../pages';

const artistSidebar = {
  sectionTitle: 'Información',
  menuItems: artistSidebarMenus,
};

function ArtistProfileAliasPage() {
  const { user } = useAuth();
  if (!user?.uid) return <Navigate to="/login" replace />;
  if (!isBackendRoleArtista(user.role)) return <Navigate to="/profile" replace />;
  return <ArtistViewPage idOverride={user.uid} />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicOnlyRoute>
            <ForgotPasswordPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <HomeRedirectPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/client"
        element={
          <ProtectedRoute>
            <AppLayout>
              <HomeClientePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/artist"
        element={
          <ProtectedRoute>
            <SidebarLayout sidebar={artistSidebar}>
              <HomeArtistaPage />
            </SidebarLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/artist/calendario"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ArtistCalendarPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/artist/services"
        element={
          <ProtectedRoute>
            <SidebarLayout sidebar={artistSidebar}>
              <ArtistServicesPage />
            </SidebarLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/artist/media"
        element={
          <ProtectedRoute>
            <SidebarLayout sidebar={artistSidebar}>
              <ArtistMediaPage />
            </SidebarLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/artist/profile"
        element={
          <ProtectedRoute>
            <ArtistProfileAliasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/artist/profile/edit"
        element={
          <ProtectedRoute>
            <SidebarLayout sidebar={artistSidebar}>
              <ArtistEditScreen />
            </SidebarLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/artist/:id"
        element={
          <ProtectedRoute>
            <ArtistViewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProfileClientePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/profile/edit"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ClientEditScreen />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AppLayout>
              <HomeAdminPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/create-artist"
        element={
          <ProtectedRoute>
            <AdminOnlyRoute>
              <AppLayout>
                <CreateArtistPage />
              </AppLayout>
            </AdminOnlyRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/organization"
        element={
          <ProtectedRoute>
            <AppLayout>
              <HomeOrganizacionPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProfileRedirectPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/edit"
        element={
          <ProtectedRoute>
            <AppLayout>
              <EditProfilePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
