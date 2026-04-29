export { api, apiPostFormData, getIdToken, ApiError } from './client';
export {
  login,
  register,
  getMe,
  getAccountChangeStatus,
  requestAccountChangeCode,
  verifyAccountChangeCode,
  changeAccountEmail,
  changeAccountPassword,
} from './authService';
export type { AccountChangeStatus } from './authService';
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
  ensureArtistProfileListedForDiscovery,
} from './artistProfileService';
export {
  normalizeArtistServiceRecord,
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
  listMyArtistFiles,
  uploadArtistFile,
  replaceArtistFile,
  updateArtistFile,
  deleteArtistFile,
} from './artistFileService';
export type { UploadArtistFileOptions, UpdateArtistFileOptions } from './artistFileService';
export type { CreateArtistServiceBody, UpdateArtistServiceBody } from '../types';
export {
  getMyArtistSongs,
  getArtistSongsByArtistId,
  createArtistSongWithFormData,
  updateArtistSongWithFormData,
  deleteArtistSong,
} from './artistSongService';
export { uploadFile, deleteStorageFile } from './storageService';
export { paymentService } from './paymentService';
export {
  fetchMyContractHistory,
  fetchMyContractHistorySafe,
  fetchSignedCartMockRecordsFromApi,
  createContract,
  createContractsForSignedLines,
  contractRecordsToSignedMockRecords,
  dispatchContractsApiRefresh,
  STAGEGO_CLIENT_CONTRACTS_API_REFRESH_EVENT,
} from './contractService';
