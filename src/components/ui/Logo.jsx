export default function Logo({ size = 28, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      style={{ transform: 'rotate(-15deg)', display: 'inline-block', verticalAlign: 'middle' }}
    >
      <circle cx="50" cy="50" r="46" fill="#FFCC00" stroke="#1A1C20" strokeWidth="5" />
      <path d="M 50 4 L 50 96" fill="none" stroke="#1A1C20" strokeWidth="5" />
      <ellipse cx="50" cy="50" rx="22" ry="46" fill="none" stroke="#1A1C20" strokeWidth="5" />
      <path d="M 10 26 Q 50 10 90 26" fill="none" stroke="#1A1C20" strokeWidth="5" strokeLinecap="round" />
      <path d="M 4 50 Q 50 35 96 50" fill="none" stroke="#1A1C20" strokeWidth="5" strokeLinecap="round" />
      <path d="M 10 74 Q 50 60 90 74" fill="none" stroke="#1A1C20" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
