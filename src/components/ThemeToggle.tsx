import { setTheme, useTheme } from '../lib/theme';

/**
 * Day / night switch. The track shows the sky you're in (stars at night, blue sky by day) and the knob
 * slides between a glowing moon and the sun, so the current mode is obvious on any background.
 */
export default function ThemeToggle() {
  const day = useTheme() === 'day';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!day}
      aria-label={day ? 'Day mode on. Switch to night' : 'Night mode on. Switch to day'}
      title={day ? 'Switch to night' : 'Switch to day'}
      onClick={() => setTheme(day ? 'night' : 'day')}
      className={`relative h-8 w-[62px] flex-none cursor-pointer overflow-hidden rounded-full border p-0 transition-[background,border-color,box-shadow] duration-500 ${
        day
          ? 'border-[#7fb6e8] bg-[linear-gradient(180deg,#8fd0ff,#cfeaff)] shadow-[inset_0_1px_3px_rgba(0,40,90,.25)]'
          : 'border-white/25 bg-[linear-gradient(180deg,#0b1430,#1d2b55)] shadow-[inset_0_1px_3px_rgba(0,0,0,.6),0_0_14px_rgba(120,150,255,.25)]'
      }`}
    >
      {/* stars (night) */}
      <span aria-hidden="true" className={`absolute inset-0 transition-opacity duration-500 ${day ? 'opacity-0' : 'opacity-100'}`}>
        {[[10, 9, 1.5], [18, 20, 1], [26, 8, 1], [33, 16, 1.5], [14, 15, 1]].map(([x, y, r], i) => (
          <i key={i} className="absolute rounded-full bg-white" style={{ left: x, top: y, width: r * 2, height: r * 2, opacity: 0.85 }} />
        ))}
      </span>
      {/* clouds (day) */}
      <span aria-hidden="true" className={`absolute bottom-1 right-2 h-2.5 w-6 rounded-full bg-white/90 transition-all duration-500 ${day ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`} />
      <span aria-hidden="true" className={`absolute bottom-2.5 right-5 h-3 w-3 rounded-full bg-white/90 transition-all duration-500 ${day ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`} />
      {/* knob: sun on the left by day, moon on the right at night */}
      <span
        aria-hidden="true"
        className={`absolute top-[3px] grid size-6 place-items-center rounded-full transition-all duration-500 [transition-timing-function:cubic-bezier(.5,1.6,.4,1)] ${
          day
            ? 'left-[3px] bg-[radial-gradient(circle_at_35%_35%,#fff6c2,#ffc627_60%,#ff9d00)] shadow-[0_0_12px_3px_rgba(255,190,40,.75)]'
            : 'left-[33px] bg-[radial-gradient(circle_at_35%_35%,#ffffff,#dfe5f2_70%)] shadow-[0_0_12px_2px_rgba(200,215,255,.7)]'
        }`}
      >
        {!day && (
          <>
            <i className="absolute left-[6px] top-[5px] size-[5px] rounded-full bg-[#b9c2d6]" />
            <i className="absolute bottom-[6px] right-[5px] size-[4px] rounded-full bg-[#b9c2d6]" />
            <i className="absolute bottom-[5px] left-[8px] size-[3px] rounded-full bg-[#c6cde0]" />
          </>
        )}
      </span>
    </button>
  );
}
