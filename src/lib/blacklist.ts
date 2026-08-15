export const BLACKLISTED_IPS = new Set([
    '192.168.1.1',
    '10.0.0.1',
    '1.1.1.1',
    '1.0.0.1',
  ]);
  
  export const BLACKLISTED_DOMAINS = [
    '.gov',
    'JokerSTRESS.today',
    'estresser.com',
  ];

  export function isBlacklisted(host: string, layer: '4' | '7'): boolean {
    let normalizedHost = host;
    if (layer === '7') {
      try {
        const url = new URL(host.startsWith('http') ? host : `http://${host}`);
        normalizedHost = url.hostname;
      } catch {
      }
    }
  
    if (BLACKLISTED_IPS.has(normalizedHost)) {
      return true;
    }
  
    if (layer === '7') {
      return BLACKLISTED_DOMAINS.some(domain => normalizedHost.endsWith(domain));
    }
  
    return false;
  }
  