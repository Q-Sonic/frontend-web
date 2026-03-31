export { api, apiPostFormData, getIdToken, ApiError } from './client';
export { login, register, getMe } from './authService';
export { getAllUsers, getUser, updateUser } from './userService';
export { getClientProfile, updateClientProfile } from './clientProfileService';
export type { ArtistProfileListFilters } from './artistProfileService';
export {
  listArtistProfiles,
  getArtistProfile,
  getArtistProfileById,
  updateArtistProfile,
  updateArtistProfileWithFormData,
  addArtistProfileMedia,
  removeArtistProfileGalleryItem,
} from './artistProfileService';
export {
  getMyArtistServices,
  getArtistServicesByArtistId,
  getArtistServiceById,
  createArtistService,
  createArtistServiceWithFormData,
  updateArtistService,
  updateArtistServiceWithFormData,
  deleteArtistService,
} from './artistServiceService';
export {
  getMyArtistSongs,
  getArtistSongsByArtistId,
  createArtistSongWithFormData,
  updateArtistSongWithFormData,
  deleteArtistSong,
} from './artistSongService';
export { uploadFile, deleteStorageFile } from './storageService';
