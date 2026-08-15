export type BanInfo = {
  reason: string;
  at: string;
  by: string;
};

export type AuditEvent = {
  at: string;
  actor: string;
  action: string;
  target?: string;
  details?: string;
};

const banByUsername = new Map<string, BanInfo>();
const auditLog: AuditEvent[] = [];
const MAX_AUDIT_EVENTS = 500;

export function setBanInfo(username: string, info: BanInfo): void {
  banByUsername.set(username, info);
}

export function clearBanInfo(username: string): void {
  banByUsername.delete(username);
}

export function getBanInfo(username: string): BanInfo | null {
  return banByUsername.get(username) ?? null;
}

export function pushAuditEvent(event: AuditEvent): void {
  auditLog.unshift(event);
  if (auditLog.length > MAX_AUDIT_EVENTS) {
    auditLog.length = MAX_AUDIT_EVENTS;
  }
}

export function getAuditEvents(limit: number = 100): AuditEvent[] {
  const safe = Number.isFinite(limit) ? Math.max(1, Math.min(500, limit)) : 100;
  return auditLog.slice(0, safe);
}

