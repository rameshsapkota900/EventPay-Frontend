import { useLocation } from "react-router-dom"

/**
 * Subtle route-level entrance animation. Respects prefers-reduced-motion via Tailwind motion-safe.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  return (
    <div
      key={location.pathname}
      className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-300 motion-safe:fill-mode-both"
    >
      {children}
    </div>
  )
}
