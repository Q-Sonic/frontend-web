function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function withMinimumDelay<T>(minMs: number, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const elapsed = Date.now() - start;
    const remaining = Math.max(0, minMs - elapsed);
    if (remaining > 0) await sleep(remaining);
    return result;
  } catch (err) {
    const elapsed = Date.now() - start;
    const remaining = Math.max(0, minMs - elapsed);
    if (remaining > 0) await sleep(remaining);
    throw err;
  }
}

