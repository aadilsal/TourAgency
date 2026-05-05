export function chunkArray<T>(arr: T[], size: number): T[][] {
  if (size <= 0) throw new Error("chunk size must be > 0");
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function importInBatches<T, R extends { processed: number }>({
  rows,
  batchSize,
  importBatch,
  merge,
}: {
  rows: T[];
  batchSize: number;
  importBatch: (batch: T[]) => Promise<R>;
  merge: (acc: R, next: R) => R;
}): Promise<R> {
  const batches = chunkArray(rows, batchSize);
  let acc: R | null = null;
  for (const batch of batches) {
    const r = await importBatch(batch);
    acc = acc ? merge(acc, r) : r;
  }
  if (!acc) {
    // @ts-expect-error - caller guarantees rows is non-empty in real usage
    return { processed: 0 };
  }
  return acc;
}

