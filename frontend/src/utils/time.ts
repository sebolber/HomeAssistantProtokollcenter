// Relative Zeit-Formatter (z. B. "vor 3 Min").
// Nutzt Intl.RelativeTimeFormat fuer i18n; Fallback auf Deutsch.

const FORMATTER = new Intl.RelativeTimeFormat("de", { numeric: "auto" });

interface TimeUnit {
  unit: Intl.RelativeTimeFormatUnit;
  seconds: number;
}

const UNITS: TimeUnit[] = [
  { unit: "year", seconds: 31_536_000 },
  { unit: "month", seconds: 2_592_000 },
  { unit: "week", seconds: 604_800 },
  { unit: "day", seconds: 86_400 },
  { unit: "hour", seconds: 3_600 },
  { unit: "minute", seconds: 60 },
  { unit: "second", seconds: 1 },
];

/**
 * Liefert eine deutsche Relativ-Zeit-Beschreibung.
 * Beispiel: formatRelative("2026-05-01T20:00:00Z", new Date("2026-05-01T20:03:00Z")) -> "vor 3 Minuten".
 * `now` ist injectable fuer Tests.
 */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "—";
  const deltaSeconds = Math.round((then.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(deltaSeconds);

  if (abs < 5) return "gerade eben";

  for (const { unit, seconds } of UNITS) {
    if (abs >= seconds) {
      const value = Math.round(deltaSeconds / seconds);
      return FORMATTER.format(value, unit);
    }
  }
  return "gerade eben";
}

/**
 * Liefert eine kompakte absolute Zeit fuer Tooltips:
 * Heute: "20:10:38"
 * Sonst: "01.05. 20:10:38"
 */
export function formatAbsolute(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return iso;
  const sameDay =
    then.getFullYear() === now.getFullYear() &&
    then.getMonth() === now.getMonth() &&
    then.getDate() === now.getDate();
  const t = then.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  if (sameDay) return t;
  const d = then.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  return `${d} ${t}`;
}
