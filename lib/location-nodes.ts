"use client";

import { BD_LOCATIONS } from "@/lib/bd-locations";

const POLL_INTERVAL_MS = 5000;

/**
 * One node in an unlimited-depth location tree: Division -> District ->
 * Upazila -> Area -> (anything an admin wants — Road, Goli, whatever) -> ...
 * There's no "level" field on purpose — a node is just "a child of some
 * parent" (or top-level, parentId null), so admins can keep nesting as deep
 * as they like without the app needing to know what to call that depth.
 */
export type LocationNode = {
  id: string;
  parentId: string | null;
  en: string;
  bn: string;
  order: number;
  /** Set the first time an admin manually reorders this node's sibling group
   * (see reorderLocationSiblings). Once any sibling in a group has this,
   * childrenOf sorts that whole group by `order` instead of alphabetically —
   * so a group stays auto-alphabetical until an admin deliberately takes
   * over, and from then on stays exactly where they put it. */
  manualOrder: boolean;
  createdAtMs: number | null;
};

/**
 * Default (no admin override yet): a division's own headquarters district
 * (and similarly a district's own "Sadar" upazila) is often literally named
 * after its parent — e.g. the Barishal division contains a Barishal
 * district. That one is pinned first; everything else sorts alphabetically
 * (dictionary order) by English name, regardless of the order nodes were
 * added in.
 *
 * Once an admin manually reorders anything in a sibling group (see
 * reorderLocationSiblings), that whole group switches to sorting strictly by
 * `order` instead — admin's explicit choice always wins over the automatic
 * alphabetical/pinned default.
 */
export function childrenOf(nodes: LocationNode[], parentId: string | null): LocationNode[] {
  const siblings = nodes.filter((node) => node.parentId === parentId);

  if (siblings.some((node) => node.manualOrder)) {
    return [...siblings].sort((left, right) => left.order - right.order || left.en.localeCompare(right.en));
  }

  const parentName = parentId ? nodes.find((node) => node.id === parentId)?.en : undefined;

  return siblings.sort((left, right) => {
    const leftPinned = parentName !== undefined && left.en === parentName;
    const rightPinned = parentName !== undefined && right.en === parentName;
    if (leftPinned !== rightPinned) {
      return leftPinned ? -1 : 1;
    }
    return left.en.localeCompare(right.en);
  });
}

/**
 * Flat, whole-tree text search — matches a node's own en/bn name (case-
 * insensitive substring) at any depth, so typing e.g. "sadar" finds every
 * "Sadar" upazila across all divisions instead of only whatever single
 * column happens to be open in the cascade picker. Each hit carries its full
 * ancestor chain (root -> ... -> node) so callers can show a breadcrumb next
 * to the name. Capped so a broad query doesn't dump the whole tree into a
 * dropdown.
 */
export function searchLocationNodes(
  nodes: LocationNode[],
  rawQuery: string,
  limit = 30
): { node: LocationNode; path: LocationNode[] }[] {
  const query = rawQuery.trim();
  const normalized = query.toLowerCase();
  if (!normalized) {
    return [];
  }

  const byId = new Map(nodes.map((node) => [node.id, node]));

  function pathTo(node: LocationNode): LocationNode[] {
    const path: LocationNode[] = [node];
    let parentId = node.parentId;
    while (parentId) {
      const parent = byId.get(parentId);
      if (!parent) break;
      path.unshift(parent);
      parentId = parent.parentId;
    }
    return path;
  }

  return nodes
    .filter((node) => node.en.toLowerCase().includes(normalized) || node.bn.includes(query))
    .sort((left, right) => left.en.localeCompare(right.en))
    .slice(0, limit)
    .map((node) => ({ node, path: pathTo(node) }));
}

/** Every fallback node's id starts with this — lets callers tell "seed data" from real DB rows. */
const FALLBACK_ID_PREFIX = "seed-";

export function isFallbackNode(node: LocationNode) {
  return node.id.startsWith(FALLBACK_ID_PREFIX);
}

/**
 * Division -> District -> Upazila from the built-in BD_LOCATIONS, flattened
 * into the same LocationNode shape, used only if the API read fails so the
 * picker is never empty.
 */
const FALLBACK_LOCATION_NODES: LocationNode[] = (() => {
  const nodes: LocationNode[] = [];

  BD_LOCATIONS.forEach((division, divisionIndex) => {
    const divisionId = `${FALLBACK_ID_PREFIX}division-${divisionIndex}`;
    nodes.push({
      id: divisionId,
      parentId: null,
      en: division.en,
      bn: division.bn,
      order: divisionIndex,
      manualOrder: false,
      createdAtMs: null,
    });

    division.districts.forEach((district, districtIndex) => {
      const districtId = `${FALLBACK_ID_PREFIX}district-${divisionIndex}-${districtIndex}`;
      nodes.push({
        id: districtId,
        parentId: divisionId,
        en: district.en,
        bn: district.bn,
        order: districtIndex,
        manualOrder: false,
        createdAtMs: null,
      });

      district.upazilas.forEach((upazila, upazilaIndex) => {
        nodes.push({
          id: `${FALLBACK_ID_PREFIX}upazila-${divisionIndex}-${districtIndex}-${upazilaIndex}`,
          parentId: districtId,
          en: upazila.en,
          bn: upazila.bn,
          order: upazilaIndex,
          manualOrder: false,
          createdAtMs: null,
        });
      });
    });
  });

  return nodes;
})();

async function fetchNodes(): Promise<LocationNode[]> {
  try {
    const response = await fetch("/api/location-nodes");
    if (!response.ok) return FALLBACK_LOCATION_NODES;
    const data = (await response.json()) as { nodes: LocationNode[] };
    return data.nodes.length > 0 ? data.nodes : FALLBACK_LOCATION_NODES;
  } catch {
    return FALLBACK_LOCATION_NODES;
  }
}

/** Public — the post-ad location picker needs the full tree. Polled so
 * admin edits show up without a manual refresh. */
export function subscribeToLocationNodes(callback: (nodes: LocationNode[]) => void) {
  let cancelled = false;

  async function tick() {
    const nodes = await fetchNodes();
    if (!cancelled) callback(nodes);
  }

  tick();
  const interval = setInterval(tick, POLL_INTERVAL_MS);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}

/** Staff-admin only (enforced server-side). Appends as the last child of parentId. */
export async function addLocationNode(input: { parentId: string | null; en: string; bn: string }) {
  const response = await fetch("/api/location-nodes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await response.json().catch(() => null)) as { node?: LocationNode } | null;
  return data?.node?.id ?? "";
}

/** Staff-admin only (enforced server-side). */
export async function updateLocationNode(id: string, input: { en: string; bn: string }) {
  await fetch(`/api/location-nodes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

/** Staff-admin only (enforced server-side). Caller is responsible for blocking deletes with children. */
export async function deleteLocationNode(id: string) {
  await fetch(`/api/location-nodes/${id}`, { method: "DELETE" });
}

/**
 * Staff-admin only (enforced server-side). Persists an admin-chosen order
 * for an entire sibling group at once — pass every sibling's id in the
 * order they should now appear in.
 */
export async function reorderLocationSiblings(orderedIds: string[]) {
  await fetch("/api/location-nodes/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderedIds }),
  });
}

/** Kept for interface compatibility — a no-op now that Postgres is
 * pre-seeded by the migration script. */
export async function seedBuiltInLocations() {
  return;
}
