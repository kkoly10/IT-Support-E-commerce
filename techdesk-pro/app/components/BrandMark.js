export default function BrandMark({ className = '', reversed = false }) {
  const bar = reversed ? '#faf8f4' : '#0f100e'
  const arrow = reversed ? '#3da366' : '#2f7a4d'
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={`brand-network-icon ${className}`.trim()}
    >
      <rect x="14" y="14" width="14" height="72" fill={bar} />
      <path d="M 30 50 L 80 14 L 58 50 L 80 86 L 30 50 Z" fill={arrow} />
    </svg>
  )
}
