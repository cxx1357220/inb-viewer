

function nowMs() {
  return performance.now();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance2(p0, p1) {
  const dx = p0[0] - p1[0];
  const dy = p0[1] - p1[1];
  return Math.sqrt(dx * dx + dy * dy);
}

function formatMs(value) {
  return `${value.toFixed(1)} ms`;
}

function withTimeout(promise, ms, label) {
  let settled = false;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`${label} timed out after ${String(ms / 1000)}s`));
    }, ms);

    promise
      .then((result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- propagating upstream rejection
        reject(err);
      });
  });
}

function resolveRuntimeBatchSize(override, defaultBatchSize) {
  const rawBatch = override || defaultBatchSize;
  const coercedBatch =
    typeof rawBatch === "number"
      ? rawBatch
      : typeof rawBatch === "string"
        ? Number.parseInt(rawBatch, 10)
        : Number.NaN;
  return Math.max(1, Number.isFinite(coercedBatch) ? coercedBatch : 1);
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

module.exports = {
  clamp,
  chunkArray,
  distance2,
  formatMs,
  nowMs,
  resolveRuntimeBatchSize,
  withTimeout,

}