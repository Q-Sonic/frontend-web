import type { SidebarMenuItem } from '../../components/AppSidebar';

function HomeIcon() {
  return (
    <svg width="13" height="12" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.1379 5.75551L6.50644 0.128163C6.4659 0.0875354 6.41774 0.0553034 6.36472 0.0333116C6.3117 0.0113198 6.25486 0 6.19746 0C6.14006 0 6.08323 0.0113198 6.03021 0.0333116C5.97719 0.0553034 5.92902 0.0875354 5.88848 0.128163L0.257031 5.75551C0.0929687 5.91957 0 6.14242 0 6.37484C0 6.85746 0.392383 7.24984 0.875 7.24984H1.46836V11.2653C1.46836 11.5073 1.66387 11.7028 1.90586 11.7028H5.32246V8.64027H6.85371V11.7028H10.4891C10.7311 11.7028 10.9266 11.5073 10.9266 11.2653V7.24984H11.5199C11.7523 7.24984 11.9752 7.15824 12.1393 6.99281C12.4797 6.65101 12.4797 6.0973 12.1379 5.75551Z" fill="white"/>
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.83333 0C2.61333 0 0 2.61333 0 5.83333C0 9.05333 2.61333 11.6667 5.83333 11.6667C9.05333 11.6667 11.6667 9.05333 11.6667 5.83333C11.6667 2.61333 9.05333 0 5.83333 0ZM5.83333 8.45833C4.38083 8.45833 3.20833 7.28583 3.20833 5.83333C3.20833 4.38083 4.38083 3.20833 5.83333 3.20833C7.28583 3.20833 8.45833 4.38083 8.45833 5.83333C8.45833 7.28583 7.28583 8.45833 5.83333 8.45833ZM5.83333 5.25C5.5125 5.25 5.25 5.5125 5.25 5.83333C5.25 6.15417 5.5125 6.41667 5.83333 6.41667C6.15417 6.41667 6.41667 6.15417 6.41667 5.83333C6.41667 5.5125 6.15417 5.25 5.83333 5.25Z" fill="#38BACC"/>
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.0833 2.33301H2.91667C2.27233 2.33301 1.75 2.85534 1.75 3.49967V11.6663C1.75 12.3107 2.27233 12.833 2.91667 12.833H11.0833C11.7277 12.833 12.25 12.3107 12.25 11.6663V3.49967C12.25 2.85534 11.7277 2.33301 11.0833 2.33301Z" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.3335 1.16699V3.50033" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4.6665 1.16699V3.50033" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1.75 5.83301H12.25" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export const artistSidebarMenus: SidebarMenuItem[] = [
  { to: '/artist/profile', label: 'Perfil', icon: <HomeIcon /> },
  { to: '/artist', label: 'Dashboard', icon: <DashboardIcon />, exactPath: true },
  { to: '/artist/calendario', label: 'Calendario', icon: <CalendarIcon /> },
];
