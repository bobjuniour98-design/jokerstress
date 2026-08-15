import crypto from 'crypto';

/**
 * Plisio IPN verification.
 *
 * Plisio signs the IPN by:
 *  1. Removing `verify_hash` from the payload.
 *  2. Serializing the remaining fields using PHP's serialize() format.
 *  3. Appending the secret API key to the serialized string.
 *  4. MD5-hashing the result.
 *
 * Reference: https://plisio.net/documentation/endpoints/callback-data
 */

function phpSerialize(data: Record<string, string>): string {
  const keys = Object.keys(data).sort();
  const entries = keys
    .map((key) => {
      const val = data[key] ?? '';
      return `s:${Buffer.byteLength(key, 'utf8')}:"${key}";s:${Buffer.byteLength(val, 'utf8')}:"${val}";`;
    })
    .join('');
  return `a:${keys.length}:{${entries}}`;
}

export function verifyIPN(
  ipnData: Record<string, string>,
  secretKey: string
): boolean {
  const receivedHash = ipnData.verify_hash;
  if (!receivedHash) return false;

  const dataWithoutHash: Record<string, string> = { ...ipnData };
  delete dataWithoutHash.verify_hash;

  const serialized = phpSerialize(dataWithoutHash);
  const calculatedHash = crypto
    .createHash('md5')
    .update(serialized + secretKey)
    .digest('hex');

  return receivedHash === calculatedHash;
}
