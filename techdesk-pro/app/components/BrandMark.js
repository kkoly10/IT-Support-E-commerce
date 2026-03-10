export default function BrandMark({ className = '', stroke = '#0D7C66' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={`brand-network-icon ${className}`.trim()}
    >
      <circle cx="50" cy="50" r="44" fill="none" stroke={stroke} strokeWidth="6" />
      <line x1="50" y1="12" x2="20" y2="72" stroke={stroke} strokeWidth="5" />
      <line x1="20" y1="72" x2="80" y2="62" stroke={stroke} strokeWidth="5" />
      <line x1="80" y1="62" x2="50" y2="12" stroke={stroke} strokeWidth="5" />
      <circle cx="50" cy="12" r="9" fill={stroke} />
      <circle cx="20" cy="72" r="9" fill={stroke} />
      <circle cx="80" cy="62" r="9" fill={stroke} />
    </svg>
  )
}
