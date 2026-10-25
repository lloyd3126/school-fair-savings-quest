const ENDPOINT = (import.meta.env.VITE_EVIDENCE_ENDPOINT || '').trim();
const STORAGE_KEY = 'fair-card-collector:evidence-outbox:v1';
const SCHEMA_VERSION = 1;
const MAX_BATCH_SIZE = 20;

let memoryQueue = [];
let isFlushing = false;

export function createEvidenceId(prefix) {
  const randomId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${randomId}`;
}

export function isEvidenceEnabled() {
  return Boolean(ENDPOINT);
}

export function queueEvidenceRecord(record) {
  if (!ENDPOINT || !record || !record.eventId) return;

  const queue = readQueue_();
  if (queue.some((item) => item.eventId === record.eventId)) return;

  queue.push(record);
  writeQueue_(queue);
  flushEvidenceQueue();
}

export function flushEvidenceQueue() {
  if (!ENDPOINT || isFlushing) return;
  isFlushing = true;

  void (async () => {
    try {
      while (true) {
        const queue = readQueue_();
        if (queue.length === 0) break;

        const batch = queue.slice(0, MAX_BATCH_SIZE);
        await sendBatch_(batch);
        const sentIds = new Set(batch.map((record) => record.eventId));
        writeQueue_(readQueue_().filter((record) => !sentIds.has(record.eventId)));
      }
    } catch (error) {
      // Keep the outbox so a later game load or decision can retry it.
      console.warn('Learning evidence is queued for retry.');
    } finally {
      isFlushing = false;
    }
  })();
}

async function sendBatch_(records) {
  const body = JSON.stringify({ schemaVersion: SCHEMA_VERSION, records });
  const request = {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body,
    keepalive: true,
  };

  try {
    const response = await fetch(ENDPOINT, request);
    if (!response.ok) throw new Error('endpoint_http_error');

    const result = await response.json();
    if (!result.ok) throw new Error('endpoint_rejected_records');
    return;
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;

    // Apps Script may not expose a readable cross-origin response. The endpoint
    // validates records and deduplicates eventId, so this opaque fallback is safe
    // to retry, but the browser cannot confirm that Sheets accepted the rows.
    const response = await fetch(ENDPOINT, { ...request, mode: 'no-cors' });
    if (response.type !== 'opaque') throw new Error('endpoint_response_unavailable');
  }
}

function readQueue_() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) memoryQueue = parsed;
    }
  } catch (error) {
    // localStorage may be unavailable in restricted browser contexts.
  }
  return memoryQueue.slice();
}

function writeQueue_(queue) {
  memoryQueue = queue;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    // Retain the current page's queue in memory when persistent storage is blocked.
  }
}
