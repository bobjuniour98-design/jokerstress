import crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function leftPad(value: string, size: number): string {
  if (value.length >= size) return value;
  return '0'.repeat(size - value.length) + value;
}

export function generateBase32Secret(bytes: number = 20): string {
  const raw = crypto.randomBytes(bytes);
  let bits = '';
  for (const b of raw) {
    bits += b.toString(2).padStart(8, '0');
  }

  let output = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0');
    output += BASE32_ALPHABET[parseInt(chunk, 2)];
  }
  return output;
}

function base32ToBuffer(secret: string): Buffer {
  const normalized = secret.toUpperCase().replace(/=+$/g, '').replace(/\s/g, '');
  let bits = '';
  for (const c of normalized) {
    const val = BASE32_ALPHABET.indexOf(c);
    if (val === -1) {
      throw new Error('Invalid base32 secret');
    }
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function hotp(secret: string, counter: number, digits: number = 6): string {
  const key = base32ToBuffer(secret);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const codeInt =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const mod = 10 ** digits;
  return leftPad(String(codeInt % mod), digits);
}

export function verifyTotpCode(
  secret: string,
  code: string,
  options?: { stepSeconds?: number; window?: number; digits?: number; nowMs?: number }
): boolean {
  const stepSeconds = options?.stepSeconds ?? 30;
  const window = options?.window ?? 1;
  const digits = options?.digits ?? 6;
  const nowMs = options?.nowMs ?? Date.now();
  const token = String(code).trim();

  if (!/^\d{6,8}$/.test(token)) return false;

  const counter = Math.floor(nowMs / 1000 / stepSeconds);
  for (let w = -window; w <= window; w++) {
    if (hotp(secret, counter + w, digits) === token) {
      return true;
    }
  }
  return false;
}

export function buildOtpAuthUrl(issuer: string, accountName: string, secret: string): string {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const qp = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${label}?${qp.toString()}`;
}
