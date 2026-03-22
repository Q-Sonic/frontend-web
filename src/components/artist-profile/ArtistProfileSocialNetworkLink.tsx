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
      className="text-white/80 hover:text-white transition p-2 rounded-xl hover:bg-white/5"
      aria-label={network}
    >
      {network === 'tiktok' && <Tiktok />}
      {network === 'youtube' && <Youtube />}
      {network === 'instagram' && <Instagram />}
      {network === 'facebook' && <Facebook />}
    </a>
  );
}
