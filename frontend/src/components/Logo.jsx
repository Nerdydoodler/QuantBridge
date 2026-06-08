export default function Logo({ className = 'w-8 h-8' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Bold Q letter */}
      <path
        d="M50 6C25.7 6 6 25.7 6 50s19.7 44 44 44c8.5 0 16.5-2.4 23.2-6.6L84 98l10-10-8.2-8.2C89.8 72.5 94 62 94 50 94 25.7 74.3 6 50 6Zm0 16c15.5 0 28 12.5 28 28s-12.5 28-28 28-28-12.5-28-28 12.5-28 28-28Z"
        fill="currentColor"
      />
      {/* Heartbeat pulse line */}
      <polyline
        points="20,50 34,50 39,38 44,58 50,26 56,66 61,40 66,50 80,50"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="mix-blend-difference"
      />
    </svg>
  )
}
