let prefersReducedMotion = $state(false);

if (typeof window !== 'undefined' && 'matchMedia' in window) {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  prefersReducedMotion = mediaQuery.matches;
  mediaQuery.addEventListener('change', (e) => {
    prefersReducedMotion = e.matches;
  });
}

export function useReducedMotion() {
  return {
    get prefersReducedMotion() {
      return prefersReducedMotion;
    },
  };
}
