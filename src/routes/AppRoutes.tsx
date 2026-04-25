import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute, AdminOnlyRoute, ClienteOnlyRoute } from '../components';
import { SidebarLayout, AuthenticatedLayout } from '../layouts';
import { artistSidebarMenus } from '../constants/menus';
import { LandingPage } from '../pages/landing';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { TermsPage } from '../pages/TermsPage';
import PaymentResultPage from '../pages/payment/PaymentResultPage';
import { EditProfilePage } from '../pages/EditProfilePage';
import { 
  HomeAdminPage, 
  HomeOrganizacionPage, 
  HomeRedirectPage, 
  HomeClientePage, 
  HomeArtistaPage 
} from '../pages/home';
import { 
  ProfileAdminPage, 
  ProfileOrganizacionPage, 
  ProfileRedirectPage, 
  ProfileClientePage 
} from '../pages/profile';
import { 
  AdminEditScreen, 
  OrganizacionEditScreen, 
  ClientEditScreen, 
  ArtistEditScreen 
} from '../pages/profileEdit';
import {
  ClientEventsPage,
  ClientContractsPage,
  ClientArtistProfileLayout,
  ClientArtistContractsSubPage,
  ClientArtistRiderSubPage,
  ClientArtistServiceDetailPage,
} from '../pages/client';
import {
  ArtistCalendarPage,
  ArtistMediaPage,
  ArtistMediaLegacyRedirect,
  ArtistProfileDocumentsPage,
  ArtistProfileGalleryPage,
  ArtistProfileCalendarPage,
  ArtistAccessSettingsPage,
  ArtistProfileIdRedirect,
  ArtistProfileLayout,
  ArtistProfileMainPage,
  ArtistServicesPage,
} from '../pages/artist';
import { CreateArtistPage } from '../pages/admin';
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
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/payment/success" element={<PaymentResultPage />} />
      <Route path="/payment/failure" element={<PaymentResultPage />} />
      <Route path="/payment/pending" element={<PaymentResultPage />} />
      <Route path="/payment/review" element={<PaymentResultPage />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Protected Routes (Shell) */}
      <Route
        element={
          <ProtectedRoute>
            <AuthenticatedLayout />
          </ProtectedRoute>
        }
      >
        {/* Redirects */}
        <Route path="/dashboard" element={<HomeRedirectPage />} />
        <Route path="/profile" element={<ProfileRedirectPage />} />
        <Route path="/profile/edit" element={<EditProfilePage />} />

        {/* Client Routes */}
        <Route element={<ClienteOnlyRoute />}>
          <Route
            path="/client"
            element={
              <SidebarLayout sidebar={clientSidebar}>
                <HomeClientePage />
              </SidebarLayout>
            }
          />
          <Route
            path="/client/events"
            element={
              <SidebarLayout sidebar={clientSidebar}>
                <ClientEventsPage />
              </SidebarLayout>
            }
          />
          <Route
            path="/client/contracts"
            element={
              <SidebarLayout sidebar={clientSidebar}>
                <ClientContractsPage />
              </SidebarLayout>
            }
          />
          <Route path="/client/profile" element={<ProfileClientePage />} />
          <Route path="/client/profile/edit" element={<ClientEditScreen />} />
          
          <Route path="/client/artists/:id" element={<ClientArtistProfileLayout />}>
            <Route index element={<ArtistProfileMainPage />} />
            <Route path="gallery" element={<ArtistProfileGalleryPage />} />
            <Route path="calendar" element={<ArtistProfileCalendarPage />} />
            <Route path="services/:serviceId" element={<ClientArtistServiceDetailPage />} />
            <Route path="contracts" element={<ClientArtistContractsSubPage />} />
            <Route path="rider" element={<ClientArtistRiderSubPage />} />
          </Route>
        </Route>

        {/* Artist Routes */}
        <Route
          path="/artist"
          element={
            <SidebarLayout sidebar={artistSidebar}>
              <HomeArtistaPage />
            </SidebarLayout>
          }
        />
        <Route path="/artist/calendario" element={<ArtistCalendarPage />} />
        <Route
          path="/artist/services"
          element={
            <SidebarLayout sidebar={artistSidebar}>
              <ArtistServicesPage />
            </SidebarLayout>
          }
        />
        <Route path="/artist/media" element={<ArtistMediaLegacyRedirect />} />
        <Route path="/artist/profile" element={<ArtistProfileIdRedirect />} />
        <Route path="/artist/:id" element={<ArtistProfileLayout />}>
          <Route index element={<ArtistProfileMainPage />} />
          <Route path="gallery/edit" element={<ArtistMediaPage />} />
          <Route path="gallery" element={<ArtistProfileGalleryPage />} />
          <Route path="documents" element={<ArtistProfileDocumentsPage />} />
          <Route path="calendar" element={<ArtistProfileCalendarPage />} />
          <Route path="services/:serviceId" element={<ClientArtistServiceDetailPage />} />
          <Route path="settings" element={<ArtistAccessSettingsPage />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminOnlyRoute />}>
          <Route path="/admin" element={<HomeAdminPage />} />
          <Route path="/admin/create-artist" element={<CreateArtistPage />} />
          <Route path="/admin/profile" element={<ProfileAdminPage />} />
          <Route path="/admin/profile/edit" element={<AdminEditScreen />} />
        </Route>

        {/* Organization Routes */}
        <Route path="/organization" element={<HomeOrganizacionPage />} />
        <Route path="/organization/profile" element={<ProfileOrganizacionPage />} />
        <Route path="/organization/profile/edit" element={<OrganizacionEditScreen />} />

        {/* Direct /home and /profile sub-routes with role segments */}
        <Route path="/home/cliente" element={<Navigate to="/client" replace />} />
        <Route path="/home/artista" element={<Navigate to="/artist" replace />} />
        <Route path="/home/admin" element={<Navigate to="/admin" replace />} />
        <Route path="/home/organizacion" element={<Navigate to="/organization" replace />} />
        
        <Route path="/profile/cliente" element={<Navigate to="/client/profile" replace />} />
        <Route path="/profile/artista" element={<Navigate to="/artist/profile" replace />} />
        <Route path="/profile/admin" element={<Navigate to="/admin/profile" replace />} />
        <Route path="/profile/organizacion" element={<Navigate to="/organization/profile" replace />} />

        <Route path="/profile/edit/cliente" element={<Navigate to="/client/profile/edit" replace />} />
        <Route path="/profile/edit/artista" element={<Navigate to="/artist/settings" replace />} />
        <Route path="/profile/edit/admin" element={<Navigate to="/admin/profile/edit" replace />} />
        <Route path="/profile/edit/organizacion" element={<Navigate to="/organization/profile/edit" replace />} />
      </Route>
    </Routes>
  );
}
