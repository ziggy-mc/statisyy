type AuditFieldValue = boolean | null | number | string;

export type AuditOutcome = "denied" | "failure" | "success";

export type AuditEvent = Readonly<{
  action: string;
  actorId?: string;
  code?: string;
  details?: Readonly<Record<string, AuditFieldValue>>;
  outcome: AuditOutcome;
  requestId?: string | null;
}>;

function getAuditTimestamp(): string {
  return new Date().toISOString();
}

function stringifyAuditEvent(event: AuditEvent): string {
  return JSON.stringify({
    action: event.action,
    actorId: event.actorId,
    code: event.code,
    details: event.details,
    outcome: event.outcome,
    requestId: event.requestId ?? null,
    timestamp: getAuditTimestamp(),
    type: "audit",
  });
}

export function writeAuditLog(event: AuditEvent): void {
  const message = stringifyAuditEvent(event);

  if (event.outcome === "success") {
    console.info(message);
    return;
  }

  console.warn(message);
}
