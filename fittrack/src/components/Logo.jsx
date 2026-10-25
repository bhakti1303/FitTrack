function Logo({ size = 36 }) {
  return (
    <div className="d-flex align-items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <defs>
          <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#B300FF" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill="url(#logoGrad)" />
        <path
          d="M8 21h4l2.5-7 5 14 2.5-7H28"
          stroke="#0D0C14"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <span className="logo-text">
        FitTrack<span style={{ color: 'var(--accent)' }}>.</span>
      </span>
    </div>
  );
}

export default Logo;