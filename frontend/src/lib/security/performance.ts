type PerformancePayload = {
  route: string
  method: string
  userId?: string
  statusCode: number
  totalMs: number
  dbMs?: number
  cache?: "HIT" | "MISS" | "BYPASS"
  payloadSizeBytes?: number
  metadata?: Record<string, unknown>
}

export function logPerformanceEvent(payload: PerformancePayload) {
  const entry = {
    timestamp: new Date().toISOString(),
    category: "performance",
    route: payload.route,
    method: payload.method,
    userId: payload.userId ?? null,
    statusCode: payload.statusCode,
    totalMs: payload.totalMs,
    dbMs: payload.dbMs ?? null,
    cache: payload.cache ?? "BYPASS",
    payloadSizeBytes: payload.payloadSizeBytes ?? null,
    metadata: payload.metadata ?? {},
  }

  console.info(JSON.stringify(entry))
}
