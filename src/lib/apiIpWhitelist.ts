import type { NextApiRequest } from 'next';
import net from 'net';

type UserWhitelist = {
  ipv4?: string;
  ipv6?: string;
};

/**
 * Global hardcoded allowlist (always allowed for external API routes).
 * Add trusted VPS IPs here.
 */
const STATIC_GLOBAL_ALLOWLIST = new Set<string>([
  // '1.2.3.4',
  // '2001:db8::1',
]);

const whitelistStore = new Map<string, UserWhitelist>();

function normalizeIp(ip: string): string {
  const trimmed = ip.trim();
  if (!trimmed) return '';

  // Remove brackets and ports:
  // - [2001:db8::1]:443 -> 2001:db8::1
  // - 1.2.3.4:443 -> 1.2.3.4
  const bracketMatch = trimmed.match(/^\[([^\]]+)\](?::\d+)?$/);
  const withoutBracket = bracketMatch ? bracketMatch[1] : trimmed;
  const hasSingleColon =
    withoutBracket.indexOf(':') === withoutBracket.lastIndexOf(':');
  const maybeIpv4WithPort = hasSingleColon
    ? withoutBracket.replace(/:\d+$/, '')
    : withoutBracket;

  if (maybeIpv4WithPort.startsWith('::ffff:')) {
    return maybeIpv4WithPort.slice(7);
  }

  return maybeIpv4WithPort;
}

export function getRequestIp(req: NextApiRequest): string | null {
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  const xRealIp = req.headers['x-real-ip'];
  const forwarded = req.headers['x-forwarded-for'];

  const pickFirst = (value: string | string[] | undefined): string => {
    if (!value) return '';
    const raw = Array.isArray(value) ? value[0] : value;
    return raw.split(',')[0]?.trim() ?? '';
  };

  const raw =
    pickFirst(cfConnectingIp) ||
    pickFirst(xRealIp) ||
    pickFirst(forwarded);

  const candidate = raw ?? req.socket?.remoteAddress ?? '';
  const normalized = normalizeIp(candidate);

  return net.isIP(normalized) ? normalized : null;
}

export function getWhitelist(userId: string): UserWhitelist {
  return whitelistStore.get(userId) ?? {};
}

export function setWhitelist(
  userId: string,
  data: UserWhitelist
): UserWhitelist {
  const next: UserWhitelist = {};

  if (data.ipv4) next.ipv4 = normalizeIp(data.ipv4);
  if (data.ipv6) next.ipv6 = normalizeIp(data.ipv6);

  whitelistStore.set(userId, next);
  return next;
}

export function isRequestIpAllowed(
  userId: string,
  requestIp: string | null
): boolean {
  if (!requestIp) return false;

  const ip = normalizeIp(requestIp);

  if (STATIC_GLOBAL_ALLOWLIST.has(ip)) {
    return true;
  }

  const whitelist = getWhitelist(userId);
  const hasWhitelist = Boolean(whitelist.ipv4 || whitelist.ipv6);

  if (!hasWhitelist) return true;

  const version = net.isIP(ip);

  if (version === 4) return whitelist.ipv4 === ip;
  if (version === 6) return whitelist.ipv6 === ip;

  return false;
}

/** True only if the user saved at least one whitelist IP and this request matches it. */
export function isRequestFromConfiguredWhitelist(
  userId: string,
  requestIp: string | null
): boolean {
  const w = getWhitelist(userId);

  if (!w.ipv4 && !w.ipv6) return false;
  if (!requestIp) return false;

  return isRequestIpAllowed(userId, requestIp);
}

export function validateWhitelistInput(
  ipv4?: string,
  ipv6?: string
): string | null {
  const normalizedV4 = ipv4?.trim() ? normalizeIp(ipv4) : '';
  const normalizedV6 = ipv6?.trim() ? normalizeIp(ipv6) : '';

  if (normalizedV4 && net.isIP(normalizedV4) !== 4) {
    return 'Invalid IPv4 address';
  }

  if (normalizedV6 && net.isIP(normalizedV6) !== 6) {
    return 'Invalid IPv6 address';
  }

  return null;
}