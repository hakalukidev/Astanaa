/**
 * Human-facing serial numbers for posts, e.g. ABC-0001. Assigned by creation
 * order (oldest first) across every listing, regardless of status — not tied
 * to any stored field, just derived on the fly from createdAtMs so there's no
 * counter to keep in sync or collide on.
 *
 * Numbering rolls over every 1000 posts, advancing the 3-letter prefix by one
 * step (ABC -> ABD -> ABE -> ...): posts 1-1000 are ABC-0001..ABC-1000, 1001-2000
 * are ABD-0001..ABD-1000, and so on.
 */

const BASE_PREFIX = "ABC";
const BLOCK_SIZE = 1000;

function incrementPrefix(prefix: string, steps: number): string {
  if (steps === 0) {
    return prefix;
  }

  const letters = prefix.split("");
  let carry = steps;

  for (let i = letters.length - 1; i >= 0 && carry > 0; i--) {
    const value = letters[i].charCodeAt(0) - 65 + carry;
    letters[i] = String.fromCharCode(65 + (value % 26));
    carry = Math.floor(value / 26);
  }

  return letters.join("");
}

/** `rank` is 1-based (the 1st post ever created is rank 1). */
export function getPostSerial(rank: number): string {
  const zeroBasedRank = rank - 1;
  const blockIndex = Math.floor(zeroBasedRank / BLOCK_SIZE);
  const numberInBlock = (zeroBasedRank % BLOCK_SIZE) + 1;
  const prefix = incrementPrefix(BASE_PREFIX, blockIndex);

  return `${prefix}-${String(numberInBlock).padStart(4, "0")}`;
}

/** Maps listing id -> serial number, ranked oldest-first across the given set. */
export function buildPostSerialMap(
  listings: { id: string; createdAtMs: number | null }[]
): Map<string, string> {
  const sorted = [...listings].sort(
    (a, b) => (a.createdAtMs ?? Infinity) - (b.createdAtMs ?? Infinity)
  );

  const map = new Map<string, string>();
  sorted.forEach((listing, index) => {
    map.set(listing.id, getPostSerial(index + 1));
  });

  return map;
}
