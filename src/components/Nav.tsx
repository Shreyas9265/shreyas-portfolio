import SmoothLink from './SmoothLink';
import ThemeToggle from './ThemeToggle';

const links = [
  { href: '#route', label: 'The route', opt: true },
  { href: '#garage', label: 'Garage', opt: true },
  { href: '#hood', label: 'Skills', opt: true },
  { href: '#contact', label: 'Contact' },
];

export default function Nav() {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 top-[env(safe-area-inset-top,0px)] z-30 border-b border-white/5 bg-bg/40 backdrop-blur-md">
      <div className="wrap flex items-center justify-between gap-4 py-3">
        <SmoothLink href="#top" className="display flex items-center gap-2.5 text-[15px] tracking-wide no-underline">
          <span className="rounded border-[1.5px] border-ink px-1.5 font-mono text-[11px] font-semibold tracking-widest">SP · 2026</span>
          Shreyas
        </SmoothLink>
        <div className="flex items-center gap-3 sm:gap-6">
        <ul className="m-0 flex list-none gap-4 p-0 text-sm sm:gap-6">
          {links.map((l) => (
            <li key={l.href} className={l.opt ? 'hidden sm:block' : ''}>
              <SmoothLink href={l.href} className="text-muted no-underline hover:text-ink">{l.label}</SmoothLink>
            </li>
          ))}
        </ul>
        <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
