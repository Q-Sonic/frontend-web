import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, PublicOnlyRoute, AdminOnlyRoute } from './components';
import {
  LandingPage,
  LoginPage,
  RegisterPage,
  EditProfilePage,
  ClientEditScreen,
  ArtistEditScreen,
  BasicEditScreen,
  HomeRedirectPage,
  HomeClientePage,
  HomeArtistaPage,
  HomeBasicoPage,
  HomeAdminPage,
  HomeOrganizacionPage,
  ProfileRedirectPage,
  ProfileClientePage,
  ProfileArtistaPage,
  ProfileBasicoPage,
  ArtistServicesPage,
  ArtistMediaPage,
  ArtistViewPage,
  CreateArtistPage,
} from './pages';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
            path="/home"
            element={
              <ProtectedRoute>
                <HomeRedirectPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home/cliente"
            element={
              <ProtectedRoute>
                <HomeClientePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home/artista"
            element={
              <ProtectedRoute>
                <HomeArtistaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/artist/services"
            element={
              <ProtectedRoute>
                <ArtistServicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/artist/media"
            element={
              <ProtectedRoute>
                <ArtistMediaPage />
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
            path="/admin/create-artist"
            element={
              <ProtectedRoute>
                <AdminOnlyRoute>
                  <CreateArtistPage />
                </AdminOnlyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/home/basico"
            element={
              <ProtectedRoute>
                <HomeBasicoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home/admin"
            element={
              <ProtectedRoute>
                <HomeAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home/organizacion"
            element={
              <ProtectedRoute>
                <HomeOrganizacionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfileRedirectPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/cliente"
            element={
              <ProtectedRoute>
                <ProfileClientePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/artista"
            element={
              <ProtectedRoute>
                <ProfileArtistaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/basico"
            element={
              <ProtectedRoute>
                <ProfileBasicoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/organizacion"
            element={
              <ProtectedRoute>
                <ProfileBasicoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <EditProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit/cliente"
            element={
              <ProtectedRoute>
                <ClientEditScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit/artista"
            element={
              <ProtectedRoute>
                <ArtistEditScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit/basico"
            element={
              <ProtectedRoute>
                <BasicEditScreen />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
