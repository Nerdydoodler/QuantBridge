export default function Logo({ className = 'w-8 h-8' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Q outer ring */}
      <circle cx="50" cy="44" r="36" stroke="currentColor" strokeWidth="6" fill="currentColor" fillOpacity="0.1" />
      {/* Q inner cutout */}
      <circle cx="50" cy="44" r="24" stroke="currentColor" strokeWidth="6" fill="none" />
      {/* Q tail */}
      <line x1="62" y1="66" x2="82" y2="94" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      {/* Heartbeat / pulse line across center */}
      <polyline
        points="14,46 28,46 34,46 39,34 44,58 50,22 56,64 61,38 66,46 72,46 86,46"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
