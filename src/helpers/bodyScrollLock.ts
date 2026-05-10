let lockDepth = 0;
let savedOverflow = '';

/**
 * Prevents background scroll while one or more overlays are open.
 * Call the returned release function on unmount or when closing.
 */
export function acquireBodyScrollLock(): () => void {
  if (lockDepth === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  lockDepth += 1;
  return () => {
    lockDepth -= 1;
    if (lockDepth <= 0) {
      lockDepth = 0;
      document.body.style.overflow = savedOverflow;
    }
  };
}
