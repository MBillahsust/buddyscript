type AuditLevel = "info" | "warn" | "error"

type AuditPayload = {
  event: string
  level?: AuditLevel
  userId?: string
  ip?: string
  route?: string
  metadata?: Record<string, unknown>
}

export function logSecurityEvent(payload: AuditPayload) {
  const entry = {
    timestamp: new Date().toISOString(),
    category: "security",
    level: payload.level ?? "warn",
    event: payload.event,
    userId: payload.userId ?? null,
    ip: payload.ip ?? null,
    route: payload.route ?? null,
    metadata: payload.metadata ?? {},
  }

  const asJson = JSON.stringify(entry)
  if (entry.level === "error") {
    console.error(asJson)
    return
  }
  if (entry.level === "warn") {
    console.warn(asJson)
    return
  }
  console.info(asJson)
}
