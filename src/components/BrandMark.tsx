import type { SVGProps } from 'react'

type BrandMarkProps = SVGProps<SVGSVGElement> & { size?: number }

/**
 * BRANDSMITH — “A Interrupção”
 * A deliberate break in the lime field represents the refusal of the obvious.
 * Kept as vector geometry so the mark stays crisp at every size.
 */
export function BrandMark({ size = 30, ...props }: BrandMarkProps) {
  return (
    <svg
      className="brand-symbol"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label="Símbolo A Interrupção do BRANDSMITH"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="40" height="40" fill="#D7FF38" />
      <path d="M16 0H25V13H16Z" fill="#111111" />
      <path d="M16 19H25V40H16Z" fill="#111111" />
      <path d="M25 13H40V19H25Z" fill="#111111" />
      <path d="M0 19H16V25H0Z" fill="#111111" />
    </svg>
  )
}

export function BrandWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? 'brand-wordmark compact' : 'brand-wordmark'}>
      BRANDSMITH<span aria-hidden="true">.</span>
    </span>
  )
}

export default function BrandLockup({ size = 30, compact = false }: BrandMarkProps & { compact?: boolean }) {
  return (
    <span className="brand-lockup-inner">
      <BrandMark size={size} />
      <BrandWordmark compact={compact} />
    </span>
  )
}
