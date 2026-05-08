// Iter E3: Wiederverwendbarer Helper fuer versionierte localStorage-
// Persistenz.
//
// Konzept-Schwaeche E3: Panel und stats-knx-view persistieren ihre
// Filter im localStorage, jeweils mit eigener (oder ohne) Migrations-
// Logik. Bei Schema-Aenderungen war das fragil. Dieser Helper kapselt
// das Pattern:
//   - DEFAULTS_VERSION-Marker pro Schluessel.
//   - Bei Mismatch wird die Migrations-Funktion gerufen, dann der
//     Marker hochgezogen.
//   - JSON-Parse-Fehler / fehlender Eintrag → Default zurueckliefern.
//
// Benutzung:
//   const filters = loadPersisted({
//     key: "messagehub.filters",
//     versionKey: "messagehub.filters.version",
//     currentVersion: "v2",
//     defaults: DEFAULT_FILTERS,
//     migrate: (raw, fromVersion) => migrateRaw(raw, fromVersion),
//   });

export interface PersistOptions<T> {
  key: string;
  versionKey: string;
  currentVersion: string;
  defaults: T;
  /** Optional: Migration der gespeicherten Daten auf die neueste Version. */
  migrate?: (raw: Partial<T>, fromVersion: string | null) => Partial<T>;
}

export function loadPersisted<T>(options: PersistOptions<T>): T {
  const { key, versionKey, currentVersion, defaults, migrate } = options;
  let stored: Partial<T> | null = null;
  let storedVersion: string | null = null;
  try {
    const raw = localStorage.getItem(key);
    if (raw) stored = JSON.parse(raw) as Partial<T>;
    storedVersion = localStorage.getItem(versionKey);
  } catch {
    // Falls localStorage gesperrt oder JSON kaputt — Default
    return { ...defaults };
  }
  if (stored === null) {
    return { ...defaults };
  }
  let migrated: Partial<T> = stored;
  if (migrate && storedVersion !== currentVersion) {
    migrated = migrate(stored, storedVersion);
    try {
      localStorage.setItem(key, JSON.stringify({ ...defaults, ...migrated }));
      localStorage.setItem(versionKey, currentVersion);
    } catch {
      // ignore
    }
  } else if (storedVersion !== currentVersion) {
    // Marker setzen, damit auch User ohne Migration auf der neuen
    // Version landen (kein Re-Migration-Loop bei spaeteren Bumps).
    try {
      localStorage.setItem(versionKey, currentVersion);
    } catch {
      // ignore
    }
  }
  return { ...defaults, ...migrated };
}

export function savePersisted<T>(
  options: Pick<PersistOptions<T>, "key" | "versionKey" | "currentVersion">,
  value: T,
): void {
  const { key, versionKey, currentVersion } = options;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    localStorage.setItem(versionKey, currentVersion);
  } catch {
    // ignore — z. B. Inkognito-Mode oder Quota
  }
}
