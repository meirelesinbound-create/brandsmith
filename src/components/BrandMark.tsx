import type { SVGProps } from 'react'

type BrandMarkProps = SVGProps<SVGSVGElement> & { size?: number }

/**
 * BRANDSMITH — approved Proposal 02: expressive typography with an
 * interruption cut integrated into the lettering. The standalone B is
 * derived from the wordmark; no unrelated geometric tile.
 */
export function BrandMark({ size = 30, ...props }: BrandMarkProps) {
  return (
    <svg
      className="brand-symbol"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Símbolo derivado do lettering BRANDSMITH"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M7 4H26C37 4 42 10 42 18C42 23 39 27 34 29C41 31 45 35 45 41V44H7V4ZM17 13V23H25C30 23 32 21 32 18C32 15 30 13 25 13H17ZM17 32V36H27C32 36 34 35 34 34C34 32 31 32 27 32H17Z" fill="#F2F0E9" />
      <path d="M29 0H41L18 48H6L29 0Z" fill="#D7FF38" />
      <path d="M24 10L19 21H25L30 10Z" fill="#111111" />
    </svg>
  )
}

export function BrandWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? 'brand-wordmark compact' : 'brand-wordmark'} aria-label="BRANDSMITH">
      BRANDSMITH<span className="brand-wordmark-cut" aria-hidden="true" />
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
