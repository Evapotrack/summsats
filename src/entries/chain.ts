import * as crypto from 'crypto';

// SHA-256 hash as lowercase hex
function sha256(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf-8').digest('hex');
}

// Compute hash chain entry per spec:
// Entry 1: hash(entry_1_text)
// Entry 2: hash(entry_2_text + hash_1)  — no entropy yet
// Entry 3+: hash(entry_N_text + hash_(N-1) + entropy_after_(N-1))
export function computeChainHash(
  entryText: string,
  prevHash: string | null,
  entropy: number | null
): string {
  let input = entryText;
  if (prevHash) {
    input += prevHash;
  }
  if (entropy !== null) {
    input += entropy.toString();
  }
  return sha256(input);
}

// Shannon entropy on UTF-8 binary representation
// H = -SUM(p(x) * log2(p(x))) for each byte value x
// Returns number between 0 and 8
export function shannonEntropy(text: string): number {
  const bytes = Buffer.from(text, 'utf-8');
  const total = bytes.length;
  if (total === 0) return 0;

  const counts: Record<number, number> = {};
  for (const byte of bytes) {
    counts[byte] = (counts[byte] || 0) + 1;
  }

  let entropy = 0;
  for (const count of Object.values(counts)) {
    const p = count / total;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}
