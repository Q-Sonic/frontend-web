import { createContext, useContext, type ReactNode } from 'react';

export type ArtistProfileNavValue = {
  basePath: string;
  exitHomePath: string;
};

const ArtistProfileNavContext = createContext<ArtistProfileNavValue | null>(null);

export function ArtistProfileNavProvider({
  value,
  children,
}: {
  value: ArtistProfileNavValue;
  children: ReactNode;
}) {
  return (
    <ArtistProfileNavContext.Provider value={value}>{children}</ArtistProfileNavContext.Provider>
  );
}

export function useArtistProfileNav(): ArtistProfileNavValue {
  const v = useContext(ArtistProfileNavContext);
  if (!v) {
    throw new Error('useArtistProfileNav must be used inside ArtistProfileNavProvider');
  }
  return v;
}
