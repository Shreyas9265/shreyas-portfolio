import type { AnchorHTMLAttributes } from 'react';
import { scrollToHash } from '../lib/lenis';

/** In-page link that glides to its section through Lenis. */
export default function SmoothLink({ href = '#top', onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={href}
      onClick={(e) => { onClick?.(e); if (href.startsWith('#')) { e.preventDefault(); scrollToHash(href); history.replaceState(null, '', href); } }}
      {...rest}
    />
  );
}
