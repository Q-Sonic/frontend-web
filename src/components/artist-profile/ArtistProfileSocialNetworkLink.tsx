import Tiktok from '../../../public/icons/Tiktok';
import Youtube from '../../../public/icons/Youtube';
import Instagram from '../../../public/icons/Instagram';
import Facebook from '../../../public/icons/Facebook';

export function ArtistProfileSocialNetworkLink({
  network,
  href,
}: {
  network: 'tiktok' | 'youtube' | 'instagram' | 'facebook';
  href?: string | undefined;
}) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center bg-transparent p-0 rounded-none text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4c8]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
      aria-label={network}
    >
      {network === 'tiktok' && <Tiktok />}
      {network === 'youtube' && <Youtube />}
      {network === 'instagram' && <Instagram />}
      {network === 'facebook' && <Facebook />}
    </a>
  );
}
