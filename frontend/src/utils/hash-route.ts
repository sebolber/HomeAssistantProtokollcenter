// Iter E6: Zentraler Hash-Parser fuer Top-Tab + Sub-Tab + Query.
//
// Konzept-Schwaeche E6: Sowohl messagehub-panel als auch stats-view
// implementierten ihre eigene Hash-Parsing-Logik (mit unterschiedlichen
// Konventionen). Bei jeder Erweiterung war das Drift-Risiko hoch
// (z. B. ``#findings?source=...`` wurde nur in stats-view erkannt,
// nicht aber im Top-Level-Tab-Switch).
//
// ``parseHashRoute`` liefert ein gemeinsames Objekt {top, sub, query}.

export type TopTab = "messages" | "settings" | "stats" | "audit";

export interface HashRoute {
  top: TopTab;
  /** Sub-Path nach dem Top-Tab, oder leer. */
  sub: string;
  /** Query-Parameter nach dem ``?``. */
  query: URLSearchParams;
}

const VALID_TOPS: ReadonlySet<string> = new Set([
  "messages",
  "settings",
  "stats",
  "audit",
]);

const SUB_TAB_ALIASES: ReadonlyMap<string, { top: TopTab; sub: string }> =
  new Map([
    // Backwards-Compat: ``#findings`` ist Alias fuer ``#stats/findings``.
    ["findings", { top: "stats", sub: "findings" }],
  ]);

export function parseHashRoute(rawHash: string): HashRoute {
  const hash = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash;
  const queryStart = hash.indexOf("?");
  const pathPart = queryStart === -1 ? hash : hash.slice(0, queryStart);
  const queryStr = queryStart === -1 ? "" : hash.slice(queryStart + 1);
  const query = new URLSearchParams(queryStr);

  // Alias zuerst pruefen — z. B. ``findings`` -> stats/findings.
  const aliased = SUB_TAB_ALIASES.get(pathPart);
  if (aliased !== undefined) {
    return { top: aliased.top, sub: aliased.sub, query };
  }

  const slash = pathPart.indexOf("/");
  const top = slash === -1 ? pathPart : pathPart.slice(0, slash);
  const sub = slash === -1 ? "" : pathPart.slice(slash + 1);
  if (VALID_TOPS.has(top)) {
    return { top: top as TopTab, sub, query };
  }
  return { top: "messages", sub: "", query };
}
