import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute, AdminOnlyRoute, ClienteOnlyRoute } from '../components';
import { AppLayout, SidebarLayout } from '../layouts';
import { artistSidebarMenus } from '../constants/menus';
import { EditProfilePage, HomeRedirectPage, ProfileRedirectPage } from '../pages/redirects';
import {
  ClientEditScreen,
  ProfileClientePage,
  DashboardPage,
  ClientEventsPage,
  ClientContractsPage,
  ClientArtistProfileLayout,
  ClientArtistContractsSubPage,
  ClientArtistRiderSubPage,
} from '../pages/client';
import {
  ArtistCalendarPage,
  ArtistMediaPage,
  ArtistProfileDocumentsPage,
  ArtistProfileGalleryPage,
  ArtistProfileCalendarPage,
  ArtistAccessSettingsPage,
  ArtistProfileIdRedirect,
  ArtistProfileLayout,
  ArtistProfileMainPage,
  ArtistServicesPage,
  HomeArtistaPage,
} from '../pages/artist';
import { LandingPage } from '../pages/landing';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { CreateArtistPage, HomeAdminPage } from '../pages/admin';
import { HomeOrganizacionPage } from '../pages/organization';
import { clientSidebarMenus } from '../constants/menus/clientMenus';

const artistSidebar = {
  sectionTitle: 'Información',
  menuItems: artistSidebarMenus,
};

const clientSidebar = {
  sectionTitle: 'Información',
  menuItems: clientSidebarMenus,
};

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
            <ClienteOnlyRoute>
              <SidebarLayout sidebar={clientSidebar}>
                <DashboardPage />
              </SidebarLayout>
            </ClienteOnlyRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/events"
        element={
          <ProtectedRoute>
            <ClienteOnlyRoute>
              <SidebarLayout sidebar={clientSidebar}>
                <ClientEventsPage />
              </SidebarLayout>
            </ClienteOnlyRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/contracts"
        element={
          <ProtectedRoute>
            <ClienteOnlyRoute>
              <SidebarLayout sidebar={clientSidebar}>
                <ClientContractsPage />
              </SidebarLayout>
            </ClienteOnlyRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/artists/:id"
        element={
          <ProtectedRoute>
            <ClienteOnlyRoute>
              <ClientArtistProfileLayout />
            </ClienteOnlyRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<ArtistProfileMainPage />} />
        <Route path="gallery" element={<ArtistProfileGalleryPage />} />
        <Route path="calendar" element={<ArtistProfileCalendarPage />} />
        <Route path="contracts" element={<ClientArtistContractsSubPage />} />
        <Route path="rider" element={<ClientArtistRiderSubPage />} />
      </Route>

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
            <ArtistProfileIdRedirect />
          </ProtectedRoute>
        }
      />
      <Route
        path="/artist/:id"
        element={
          <ProtectedRoute>
            <ArtistProfileLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ArtistProfileMainPage />} />
        <Route path="gallery" element={<ArtistProfileGalleryPage />} />
        <Route path="documents" element={<ArtistProfileDocumentsPage />} />
        <Route path="calendar" element={<ArtistProfileCalendarPage />} />
        <Route path="settings" element={<ArtistAccessSettingsPage />} />
      </Route>
      <Route
        path="/client/profile"
        element={
          <ProtectedRoute>
            <ClienteOnlyRoute>
              <AppLayout>
                <ProfileClientePage />
              </AppLayout>
            </ClienteOnlyRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/profile/edit"
        element={
          <ProtectedRoute>
            <ClienteOnlyRoute>
              <AppLayout>
                <ClientEditScreen />
              </AppLayout>
            </ClienteOnlyRoute>
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
