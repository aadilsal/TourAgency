export function chunkArray<T>(arr: T[], size: number): T[][] {
  if (size <= 0) throw new Error("chunk size must be > 0");
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function withOffsetErrors<R>(result: R, offset: number): R {
  if (offset === 0 || !result || typeof result !== "object") return result;
  const errors = (result as { errors?: unknown }).errors;
  if (!Array.isArray(errors)) return result;
  return {
    ...result,
    errors: errors.map((e) =>
      e && typeof e === "object" && typeof (e as { index?: unknown }).index === "number"
        ? { ...e, index: (e as { index: number }).index + offset }
        : e,
    ),
  };
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
  let offset = 0;
  for (const batch of batches) {
    const raw = await importBatch(batch);
    // Servers report row errors relative to the batch; make them file-relative
    // so "row 3 failed" points at the right spreadsheet row.
    const r = withOffsetErrors(raw, offset);
    acc = acc ? merge(acc, r) : r;
    offset += batch.length;
  }
  if (!acc) {
    // @ts-expect-error - caller guarantees rows is non-empty in real usage
    return { processed: 0 };
  }
  return acc;
}

